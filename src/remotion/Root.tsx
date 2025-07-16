import { Composition } from "remotion";
import { BallEscape } from "./BallEscape";
import { BallEscapeWithComments } from "./BallEscapeWithComments";
import { BallEscapeWithMultipleComments } from "./BallEscapeWithMultipleComments";
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
      <Composition
        id="BallEscapeWithComments"
        component={BallEscapeWithComments}
        durationInFrames={GAME_CONFIG.DURATION_IN_SECONDS * GAME_CONFIG.FPS}
        fps={GAME_CONFIG.FPS}
        width={GAME_CONFIG.VIDEO_WIDTH}
        height={GAME_CONFIG.VIDEO_HEIGHT}
      />
      <Composition
        id="BallEscapeWithMultipleComments"
        component={BallEscapeWithMultipleComments}
        durationInFrames={GAME_CONFIG.DURATION_IN_SECONDS * GAME_CONFIG.FPS}
        fps={GAME_CONFIG.FPS}
        width={GAME_CONFIG.VIDEO_WIDTH}
        height={GAME_CONFIG.VIDEO_HEIGHT}
        defaultProps={{
          commentCount: 2,
          commentDelay: 90,
          autoGenerate: true,
        }}
      />
    </>
  );
};

export default RemotionRoot;
