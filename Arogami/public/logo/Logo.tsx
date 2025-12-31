import * as React from "react";

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

function Logo(props: LogoProps) {
  return (
    <img
      src="/navbar/Arogami-logo-main.png"
      alt="Arogami Logo"
      height={58}
      style={{ height: "58px", width: "auto" }}
      {...props}
    />
  );
}

export default Logo;
