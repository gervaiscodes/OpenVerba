import React from "react";

export function Firework() {
  return (
    <span style={{ position: "absolute", left: "50%", top: "50%", pointerEvents: "none", width: 0, height: 0 }}>
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * 360;
        const dist = 20 + Math.random() * 15;
        const tx = Math.cos((angle * Math.PI) / 180) * dist + "px";
        const ty = Math.sin((angle * Math.PI) / 180) * dist + "px";
        return (
          <span
            key={i}
            className="firework-particle"
            style={
              {
                "--tx": tx,
                "--ty": ty,
                animation: "firework-pop 0.6s ease-out forwards",
              } as React.CSSProperties
            }
          />
        );
      })}
    </span>
  );
}
