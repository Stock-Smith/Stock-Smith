"use client";

import Particles from "react-tsparticles";
import { Engine } from "tsparticles-engine";
import { loadSlim } from "tsparticles-slim";

export default function ParticlesBackground() {
  async function particlesInit(engine: Engine) {
    await loadSlim(engine);
  }

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={{
        fullScreen: { enable: false }, // don't cover entire screen forcibly
        background: { color: "#1a1a24" },
        particles: {
          number: { value: 50 },
          size: { value: 2 },
          color: { value: "#00ffcc" },
          links: { enable: true, color: "#00ffcc" },
          move: { enable: true, speed: 0.6 },
        },
      }}
      style={{
        position: "absolute",
        zIndex: 0,
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
      }}
    />
  );
}
