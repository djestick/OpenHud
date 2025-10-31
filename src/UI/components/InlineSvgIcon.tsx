interface InlineSvgIconProps {
  svg: string;
  className?: string;
}

export const InlineSvgIcon = ({ svg, className }: InlineSvgIconProps) => {
  return (
    <span
      className={`inline-flex inline-svg-icon ${className ?? ""}`}
      aria-hidden={true}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};
