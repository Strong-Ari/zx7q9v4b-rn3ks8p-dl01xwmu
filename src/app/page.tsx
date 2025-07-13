"use client";

import { Player } from "@remotion/player";
import { BallEscape } from "../remotion/BallEscape";
import { GAME_CONFIG } from "../constants/game";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-white mb-8">
        Ball Escape Preview
      </h1>

      {/* Player Remotion */}
      <div className="w-full max-w-3xl aspect-[9/16] bg-black rounded-lg overflow-hidden shadow-2xl">
        <Player
          component={BallEscape}
          durationInFrames={GAME_CONFIG.DURATION_IN_SECONDS * GAME_CONFIG.FPS}
          compositionWidth={GAME_CONFIG.VIDEO_WIDTH}
          compositionHeight={GAME_CONFIG.VIDEO_HEIGHT}
          fps={GAME_CONFIG.FPS}
          style={{
            width: "100%",
            height: "100%",
          }}
          controls
          autoPlay
          loop
        />
      </div>

      {/* Instructions */}
      <div className="mt-8 max-w-3xl text-gray-300 space-y-4">
        <h2 className="text-2xl font-semibold text-white">Comment jouer :</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>
            Regardez les balles "Yes" et "No" se déplacer à travers les cercles
          </li>
          <li>
            Chaque fois qu'une balle traverse un cercle, il explose et le score
            augmente
          </li>
          <li>Les collisions produisent des sons MIDI</li>
          <li>Le jeu dure {GAME_CONFIG.DURATION_IN_SECONDS} secondes</li>
          <li>À la fin, le gagnant est déterminé par le plus grand score</li>
        </ul>

        <h2 className="text-2xl font-semibold text-white mt-6">
          Pour exporter la vidéo :
        </h2>
        <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto">
          <code>
            npx remotion render src/remotion/Root.tsx BallEscape out/video.mp4
          </code>
        </pre>
      </div>
    </main>
  );
}
