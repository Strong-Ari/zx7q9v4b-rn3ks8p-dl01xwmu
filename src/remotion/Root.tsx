import { Composition } from "remotion";
import { BallEscape } from "./BallEscape";
import { GAME_CONFIG } from "../constants/game";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BallEscape"
        component={BallEscape}
        durationInFrames={GAME_CONFIG.DURATION_IN_SECONDS * GAME_CONFIG.FPS}
        fps={GAME_CONFIG.FPS}
        width={GAME_CONFIG.VIDEO_WIDTH}
        height={GAME_CONFIG.VIDEO_HEIGHT}
      />
    </>
  );
};

export default RemotionRoot;
