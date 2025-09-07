import * as React from "react";

function Logo(props) {
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
