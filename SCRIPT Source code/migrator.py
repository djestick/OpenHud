import sqlite3
import os
import shutil
import uuid
from datetime import datetime
from urllib.parse import urlparse
import sys
import json 
import requests 

# --- REQUIRED IMPORT ---
# NOTE: You MUST run 'pip install playwright' AND 'playwright install'
try:
    from playwright.sync_api import sync_playwright
except ImportError:
    # A soft fail message if the library is missing
    def sync_playwright():
        raise SystemExit("\nFATAL ERROR: Playwright not installed. Please run 'pip install playwright' and 'playwright install'")


# --- Configuration ---
APPDATA_PATH = os.getenv('APPDATA')
OLD_DB_PATH = os.path.join(APPDATA_PATH, 'openhud', 'database.db')
NEW_DB_PATH = os.path.join(APPDATA_PATH, 'openhud', 'database.v1.db')

# Target folder for player photos
PLAYER_AVATAR_FOLDER = os.path.join(
    APPDATA_PATH,
    'openhud',
    'uploads',
    'player_pictures'
)

# Target folder for team logos
TEAMS_AVATAR_FOLDER = os.path.join(
    APPDATA_PATH,
    'openhud',
    'uploads',
    'team_logos'
)

# Headers for Playwright context
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

# --- Helper Functions ---

def get_timestamp():
    """
    FIXED: Returns a UTC timestamp string in the format YYYY-MM-DD HH:MM:SS.
    This format is used for all migrated data records.
    """
    return datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
    
def clean_extra_field(extra_value):
    """
    Checks the 'extra' field for corruption (None, '[Object Object]', 'undefined', 
    or invalid JSON) and guarantees that a valid JSON string is returned.
    """
    if extra_value is None:
        return '{}'
    
    value_str = str(extra_value).strip()
    
    if value_str.lower() in ('[object object]', 'undefined', ''):
        return '{}'
    
    try:
        json.loads(value_str)
        return value_str
    except (json.JSONDecodeError, TypeError):
        print(f"  -> WARNING: Found non-JSON/corrupt extra field: '{value_str[:50]}...'. Replacing with '{{}}'.")
        return '{}'

def create_new_db_schema(conn):
    """
    Creates the required tables in the new database, matching the application's required schema 
    with DEFAULT constraints, Foreign Keys, and Triggers.
    """
    cursor = conn.cursor()
    
    print("Creating new database schema...")

    # 1. PLAYERS Table (Uses DATETIME DEFAULT CURRENT_TIMESTAMP)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS players (
            _id TEXT PRIMARY KEY NOT NULL UNIQUE,
            firstName TEXT,
            lastName TEXT,
            username TEXT NOT NULL UNIQUE, 
            avatar TEXT, 
            country TEXT,
            steamid TEXT UNIQUE,
            team TEXT,
            extra TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 2. TEAMS Table (Uses DATETIME DEFAULT CURRENT_TIMESTAMP)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS teams (
            _id TEXT PRIMARY KEY NOT NULL UNIQUE,
            name TEXT,
            country TEXT,
            shortName TEXT,
            logo TEXT,
            extra TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 3. COACHES Table (Uses DATETIME DEFAULT CURRENT_TIMESTAMP)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS coaches (
            steamid TEXT PRIMARY KEY NOT NULL UNIQUE,
            name TEXT,
            team TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (team) REFERENCES teams(_id) ON DELETE SET NULL
        )
    ''')

    # 4. MATCHES Table (Uses DATETIME DEFAULT CURRENT_TIMESTAMP)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS matches (
            id TEXT PRIMARY KEY NOT NULL UNIQUE,
            current INTEGER DEFAULT 0 CHECK (current IN (0, 1)),
            left_id TEXT,
            left_wins INTEGER DEFAULT 0 CHECK (left_wins BETWEEN 0 AND 5),
            right_id TEXT,
            right_wins INTEGER DEFAULT 0 CHECK (right_wins BETWEEN 0 AND 5),
            matchType TEXT NOT NULL CHECK (matchType IN ('bo1', 'bo2', 'bo3', 'bo5', 'Legacy')),
            vetos TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    print("Table schemas created/updated. Adding Triggers...")

    # 5. Add UPDATE Triggers for automatic updatedAt management 
    
    # PLAYERS Trigger
    cursor.execute('''
        CREATE TRIGGER IF NOT EXISTS update_players_updatedAt
        AFTER UPDATE ON players
        FOR EACH ROW
        BEGIN
            UPDATE players SET updatedAt = CURRENT_TIMESTAMP WHERE _id = OLD._id;
        END
    ''')
    
    # TEAMS Trigger
    cursor.execute('''
        CREATE TRIGGER IF NOT EXISTS update_teams_updatedAt
        AFTER UPDATE ON teams
        FOR EACH ROW
        BEGIN
            UPDATE teams SET updatedAt = CURRENT_TIMESTAMP WHERE _id = OLD._id;
        END
    ''')
    
    # COACHES Trigger
    cursor.execute('''
        CREATE TRIGGER IF NOT EXISTS update_coaches_updatedAt
        AFTER UPDATE ON coaches
        FOR EACH ROW
        BEGIN
            UPDATE coaches SET updatedAt = CURRENT_TIMESTAMP WHERE steamid = OLD.steamid;
        END
    ''')

    # MATCHES Trigger 
    cursor.execute('''
        CREATE TRIGGER IF NOT EXISTS update_matches_updatedAt
        AFTER UPDATE ON matches
        FOR EACH ROW
        BEGIN
            UPDATE matches SET updatedAt = CURRENT_TIMESTAMP WHERE id = OLD.id;
        END
    ''')
    
    conn.commit()
    print("Triggers added. Schema setup complete.")

# --- Core Migration Functions ---

def migrate_players(old_conn, new_conn, page):
    os.makedirs(PLAYER_AVATAR_FOLDER, exist_ok=True)
    old_conn.row_factory = sqlite3.Row
    old_cursor = old_conn.cursor()
    try:
        old_cursor.execute('SELECT * FROM players')
        old_players = old_cursor.fetchall()
    except sqlite3.OperationalError as e:
        print(f"FATAL ERROR: Error reading 'players' table from old DB. Does it exist? Error: {e}")
        return 0
    print(f"\nFound {len(old_players)} player records to migrate.")
    new_cursor = new_conn.cursor()
    migrated_count = 0
    for old_player_row in old_players:
        old_player = dict(old_player_row) 
        username = old_player.get('username', 'N/A')
        current_time = get_timestamp() # Uses new fixed timestamp format
        old_avatar_source = old_player.get('avatar')
        new_avatar_filename = None 
        
        # --- Avatar Download/Copy Logic ---
        if old_avatar_source:
            try:
                is_url = old_avatar_source.lower().startswith(('http://', 'https://'))
                new_avatar_uuid = str(uuid.uuid4())
                
                if is_url:
                    page.set_extra_http_headers(HEADERS)
                    response = page.goto(old_avatar_source, wait_until="load", timeout=60000)
                    if response is None or response.status >= 400:
                        raise Exception(f"Playwright failed to get a response (Status: {response.status if response else 'N/A'}).")
                    image_data = response.body()
                    
                    path = urlparse(old_avatar_source).path
                    _, file_ext = os.path.splitext(path)
                    if not file_ext or len(file_ext) > 5 or file_ext.lower() not in ('.jpg', '.png', '.jpeg', '.webp'):
                        content_type = response.headers.get('Content-Type', '')
                        file_ext = '.jpg' if 'image/jpeg' in content_type else '.png' 
                        
                    new_avatar_filename = f"{new_avatar_uuid}{file_ext}"
                    new_avatar_full_path = os.path.join(PLAYER_AVATAR_FOLDER, new_avatar_filename)
                    with open(new_avatar_full_path, 'wb') as f:
                        f.write(image_data)
                
                elif os.path.exists(old_avatar_source):
                    _, file_ext = os.path.splitext(old_avatar_source)
                    new_avatar_filename = f"{new_avatar_uuid}{file_ext}"
                    new_avatar_full_path = os.path.join(PLAYER_AVATAR_FOLDER, new_avatar_filename)
                    shutil.copy2(old_avatar_source, new_avatar_full_path)

            except Exception as e:
                print(f"  !!! CRITICAL ERROR processing avatar for {username} ('{old_avatar_source}'). Error: {e}")
                new_avatar_filename = None
        
        player_data = (
            old_player.get('_id'),
            old_player.get('firstName'),
            old_player.get('lastName'),
            username,
            new_avatar_filename,  
            old_player.get('country'),
            old_player.get('steamid'),
            old_player.get('team'),
            clean_extra_field(old_player.get('extra')), 
            current_time,     
            current_time,     
        )
        try:
            new_cursor.execute('''
                INSERT INTO players (
                    _id, firstName, lastName, username, avatar, country, steamid, team, extra, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', player_data)
            migrated_count += 1
            # print(f"  -> SUCCESS: Migrated player {username} (ID: {old_player.get('_id')}).")
        except sqlite3.IntegrityError as e:
            print(f"  !!! ERROR inserting {username}: Integrity failed (e.g., duplicate _id). Record skipped. Error: {e}")
        except Exception as e:
            print(f"  !!! UNEXPECTED ERROR inserting {username}. Record skipped. Error: {e}")
            
    return migrated_count

def migrate_teams(old_conn, new_conn, page):
    os.makedirs(TEAMS_AVATAR_FOLDER, exist_ok=True)
    old_conn.row_factory = sqlite3.Row
    old_cursor = old_conn.cursor()
    try:
        old_cursor.execute('SELECT * FROM teams')
        old_teams = old_cursor.fetchall()
    except sqlite3.OperationalError as e:
        print(f"FATAL ERROR: Error reading 'teams' table from old DB. Does it exist? Error: {e}")
        return 0
    
    print(f"\nFound {len(old_teams)} team records to migrate.")
    new_cursor = new_conn.cursor()
    migrated_count = 0
    
    for old_team_row in old_teams:
        old_team = dict(old_team_row) 
        name = old_team.get('name', 'N/A')
        current_time = get_timestamp() # Uses new fixed timestamp format
        old_logo_source = old_team.get('logo')
        new_logo_filename = None 
        
        # --- Logo Download/Copy Logic ---
        if old_logo_source:
            try:
                is_url = old_logo_source.lower().startswith(('http://', 'https://'))
                new_logo_uuid = str(uuid.uuid4())
                
                if is_url:
                    page.set_extra_http_headers(HEADERS)
                    response = page.goto(old_logo_source, wait_until="load", timeout=60000)
                    if response is None or response.status >= 400:
                        raise Exception(f"Playwright failed to get a response (Status: {response.status if response else 'N/A'}).")
                    image_data = response.body()
                    
                    path = urlparse(old_logo_source).path
                    _, file_ext = os.path.splitext(path)
                    if not file_ext or len(file_ext) > 5 or file_ext.lower() not in ('.jpg', '.png', '.jpeg', '.webp'):
                        content_type = response.headers.get('Content-Type', '')
                        file_ext = '.jpg' if 'image/jpeg' in content_type else '.png' 
                        
                    new_logo_filename = f"{new_logo_uuid}{file_ext}"
                    new_logo_full_path = os.path.join(TEAMS_AVATAR_FOLDER, new_logo_filename)
                    with open(new_logo_full_path, 'wb') as f:
                        f.write(image_data)
                
                elif os.path.exists(old_logo_source):
                    _, file_ext = os.path.splitext(old_logo_source)
                    new_logo_filename = f"{new_logo_uuid}{file_ext}"
                    new_logo_full_path = os.path.join(TEAMS_AVATAR_FOLDER, new_logo_filename)
                    shutil.copy2(old_logo_source, new_logo_full_path)

            except Exception as e:
                print(f"  !!! CRITICAL ERROR processing logo for {name} ('{old_logo_source}'). Error: {e}")
                new_logo_filename = None
        
        team_data = (
            old_team.get('_id'),
            name,
            old_team.get('country'),
            old_team.get('shortName'),
            new_logo_filename,
            clean_extra_field(old_team.get('extra')), 
            current_time,     
            current_time,     
        )
        try:
            new_cursor.execute('''
                INSERT INTO teams (
                    _id, name, country, shortName, logo, extra, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', team_data)
            migrated_count += 1
            # print(f"  -> SUCCESS: Migrated team {name} (ID: {old_team.get('_id')}).")
        except sqlite3.IntegrityError as e:
            print(f"  !!! ERROR inserting {name}: Integrity failed (e.g., duplicate _id). Record skipped. Error: {e}")
        except Exception as e:
            print(f"  !!! UNEXPECTED ERROR inserting {name}. Record skipped. Error: {e}")

    return migrated_count

def migrate_coaches(old_conn, new_conn):
    old_conn.row_factory = sqlite3.Row
    old_cursor = old_conn.cursor()
    try:
        old_cursor.execute('SELECT steamid FROM coaches')
        old_coaches = old_cursor.fetchall()
    except sqlite3.OperationalError as e:
        print(f"\nINFO: 'coaches' table not found in old DB. Assuming no coach data to migrate. Error: {e}")
        return 0

    print(f"\nFound {len(old_coaches)} coach records to migrate.")
    new_cursor = new_conn.cursor()
    migrated_count = 0
    current_time = get_timestamp() # Uses new fixed timestamp format
    
    for old_coach_row in old_coaches:
        old_coach = dict(old_coach_row)
        steamid = old_coach.get('steamid')
        
        coach_data = (
            steamid,
            None, # name
            None, # team
            current_time,
            current_time,
        )
        try:
            new_cursor.execute('''
                INSERT INTO coaches (
                    steamid, name, team, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?)
            ''', coach_data)
            migrated_count += 1
            # print(f"  -> SUCCESS: Migrated coach {steamid}.")
        except sqlite3.IntegrityError as e:
            print(f"  !!! ERROR inserting coach {steamid}: Integrity failed. Record skipped. Error: {e}")
        except Exception as e:
            print(f"  !!! UNEXPECTED ERROR inserting coach {steamid}. Record skipped. Error: {e}")
            
    return migrated_count

def migrate_matches(old_conn, new_conn):
    old_conn.row_factory = sqlite3.Row
    old_cursor = old_conn.cursor()
    
    try:
        # Use the confirmed column names: id, current, left_id, left_wins, right_id, right_wins, matchType, vetos
        old_cursor.execute('SELECT id, current, left_id, left_wins, right_id, right_wins, matchType, vetos FROM matches')
        old_matches = old_cursor.fetchall()
    except sqlite3.OperationalError as e:
        print(f"FATAL ERROR: Error reading 'matches' table from old DB. Does it exist? Error: {e}")
        return 0

    print(f"\nFound {len(old_matches)} match records to migrate.")
    new_cursor = new_conn.cursor()
    migrated_count = 0
    current_time = get_timestamp() # Uses new fixed timestamp format

    for old_match_row in old_matches:
        old_match = dict(old_match_row)
        
        # Ensure 'current' is treated as an integer (0 or 1)
        current_status = 1 if old_match.get('current') in (1, 'true', 'True') else 0
        
        match_data = (
            old_match.get('id'),
            current_status,
            old_match.get('left_id'),
            old_match.get('left_wins', 0),
            old_match.get('right_id'),
            old_match.get('right_wins', 0),
            old_match.get('matchType', 'Legacy'),
            clean_extra_field(old_match.get('vetos')),
            current_time,
            current_time,
        )
        
        try:
            new_cursor.execute('''
                INSERT INTO matches (
                    id, current, left_id, left_wins, right_id, right_wins, matchType, vetos, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', match_data)
            migrated_count += 1
            # print(f"  -> SUCCESS: Migrated match {old_match.get('id')}.")
        except sqlite3.IntegrityError as e:
            print(f"  !!! ERROR inserting match {old_match.get('id')}: Integrity failed. Record skipped. Error: {e}")
        except Exception as e:
            print(f"  !!! UNEXPECTED ERROR inserting match {old_match.get('id')}. Record skipped. Error: {e}")

    return migrated_count


# --- Main Migration Runner ---

def run_migration():
    # 1. Setup connections
    if not os.path.exists(OLD_DB_PATH):
        print(f"FATAL ERROR: Old database file not found at {OLD_DB_PATH}")
        return

    try:
        old_conn = sqlite3.connect(OLD_DB_PATH)
    except Exception as e:
        print(f"FATAL ERROR: Could not open old database file. Error: {e}")
        return
        
    # Delete old target file if it exists
    if os.path.exists(NEW_DB_PATH):
        try:
            os.remove(NEW_DB_PATH)
            print(f"Deleted old target file: {os.path.basename(NEW_DB_PATH)}")
        except Exception as e:
            print(f"FATAL ERROR: Could not delete old {os.path.basename(NEW_DB_PATH)}. Please close any program using it and try again. Error: {e}")
            old_conn.close()
            return

    try:
        new_conn = sqlite3.connect(NEW_DB_PATH)
        create_new_db_schema(new_conn)
    except Exception as e:
        print(f"FATAL ERROR: Could not create new database schema. Error: {e}")
        old_conn.close()
        return

    # 2. Run migrations
    migrated_players = 0
    migrated_teams = 0
    coach_count = 0
    match_count = 0
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            context = browser.new_context()
            page = context.new_page()

            # Player Migration (Includes avatar download)
            migrated_players = migrate_players(old_conn, new_conn, page)
            
            # Team Migration (Includes logo download)
            migrated_teams = migrate_teams(old_conn, new_conn, page)
            
            browser.close()
            
        # Coach Migration (Simplified)
        coach_count = migrate_coaches(old_conn, new_conn)
        
        # Match Migration (Corrected)
        match_count = migrate_matches(old_conn, new_conn)
            
    except Exception as e:
        print(f"\n!!! CRITICAL MIGRATION ERROR: {e}")
        print("Migration incomplete. Check the logs above for detailed errors.")
    finally:
        # 3. Commit and Close
        new_conn.commit()
        old_conn.close()
        new_conn.close()

    print("\n-------------------------------------------")
    print("✅ Full Database Migration Complete!")
    print(f"Players migrated: {migrated_players}")
    print(f"Teams migrated: {migrated_teams}")
    print(f"Coaches migrated: {coach_count}")
    print(f"Matches migrated: {match_count}")
    print("New database file created: database.v1.db")
    print("-------------------------------------------")


# --- Main Execution ---\

if __name__ == "__main__":
    if not os.path.exists(OLD_DB_PATH):
        print(f"FATAL ERROR: Old database file not found at {OLD_DB_PATH}")
        print("Please ensure the old file is at %APPDATA%/openhud/database.db")
    else:
        # Check for necessary libraries
        try:
            import requests 
            from playwright.sync_api import sync_playwright
        except ImportError:
            print("FATAL ERROR: Required libraries are missing.")
            print("Please run these two commands:")
            print("1. pip install playwright requests")
            print("2. playwright install")
            sys.exit(1)

        # --- WARNING AND CONFIRMATION ---
        print("=" * 70)
        print("                ⚠️ WARNING: DATABASE MIGRATION ⚠️")
        print("=" * 70)
        print("This file migrates the old database.db file into the newer database.v1.db.")
        print(f"1. This script will **DELETE** any existing file named: {os.path.basename(NEW_DB_PATH)}, the old file should be safe")
        print("2. It will then generate a new 'database.v1.db' from the old 'database.db'.")
        print("\n🚨 Please keep a **backup copy** of your original **database.db** file just in case.")
        print("=" * 70)
        
        # Require user confirmation
        proceed = input("Proceed? (y/n)")
        
        if proceed == 'y' or proceed == 'Y':
            run_migration() 
        else:
            print("\nMigration aborted. The database files have not been modified.")
            
    input("\nPress ENTER to close the window...")