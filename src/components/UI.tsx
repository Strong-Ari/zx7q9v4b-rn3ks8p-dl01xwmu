import React from "react";
import { spring, useCurrentFrame } from "remotion";
import { GAME_CONFIG } from "../constants/game";

// Composant Commentaire TikTok
export const Comment: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = spring({
    frame,
    fps: GAME_CONFIG.FPS,
    config: {
      damping: 200,
    },
  });

  return (
    <div
      style={{
        position: "absolute",
        top: GAME_CONFIG.COMMENT_STYLE.TOP_POSITION,
        left: "50%",
        transform: "translateX(-50%)",
        opacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "8px",
        width: "auto",
        zIndex: 10,
      }}
    >
      {/* Avatar et ID */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          color: GAME_CONFIG.COLORS.TEXT_SECONDARY,
          fontSize: "18px",
          fontFamily: GAME_CONFIG.UI_FONT,
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "#666",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span>👤</span>
        </div>
        <span>lukas1picer · 26m ago</span>
      </div>

      {/* Texte du commentaire */}
      <div
        style={{
          color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
          fontSize: GAME_CONFIG.COMMENT_STYLE.FONT_SIZE,
          fontFamily: GAME_CONFIG.UI_FONT,
          background: "rgba(0, 0, 0, 0.5)",
          padding: GAME_CONFIG.COMMENT_STYLE.PADDING,
          borderRadius: GAME_CONFIG.COMMENT_STYLE.BORDER_RADIUS,
          backdropFilter: "blur(10px)",
          fontWeight: "600",
        }}
      >
        {GAME_CONFIG.COMMENT_TEXT}
      </div>
    </div>
  );
};

// Composant Score
interface ScoreboardProps {
  yesScore: number;
  noScore: number;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  yesScore,
  noScore,
}) => {
  const frame = useCurrentFrame();

  const opacity = spring({
    frame,
    fps: GAME_CONFIG.FPS,
    config: {
      damping: 200,
    },
  });

  return (
    <div
      style={{
        position: "absolute",
        top: GAME_CONFIG.SCORE_STYLE.TOP_POSITION,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: GAME_CONFIG.SCORE_STYLE.SPACING,
        opacity,
        zIndex: 10,
      }}
    >
      {/* Score Yes */}
      <div
        style={{
          background: GAME_CONFIG.COLORS.SCORE_YES_BG,
          padding: GAME_CONFIG.SCORE_STYLE.PADDING,
          borderRadius: GAME_CONFIG.SCORE_STYLE.BORDER_RADIUS,
          color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
          fontSize: GAME_CONFIG.SCORE_STYLE.FONT_SIZE,
          fontFamily: GAME_CONFIG.UI_FONT,
          fontWeight: "bold",
        }}
      >
        {GAME_CONFIG.SCORE_FORMAT.YES.replace("{score}", yesScore.toString())}
      </div>

      {/* Score No */}
      <div
        style={{
          background: GAME_CONFIG.COLORS.SCORE_NO_BG,
          padding: GAME_CONFIG.SCORE_STYLE.PADDING,
          borderRadius: GAME_CONFIG.SCORE_STYLE.BORDER_RADIUS,
          color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
          fontSize: GAME_CONFIG.SCORE_STYLE.FONT_SIZE,
          fontFamily: GAME_CONFIG.UI_FONT,
          fontWeight: "bold",
        }}
      >
        {GAME_CONFIG.SCORE_FORMAT.NO.replace("{score}", noScore.toString())}
      </div>
    </div>
  );
};

// Composant Timer
interface TimerProps {
  timeLeft: number;
}

export const Timer: React.FC<TimerProps> = ({ timeLeft }) => {
  const frame = useCurrentFrame();

  const opacity = spring({
    frame,
    fps: GAME_CONFIG.FPS,
    config: {
      damping: 200,
    },
  });

  return (
    <div
      style={{
        position: "absolute",
        top: GAME_CONFIG.TIMER_STYLE.TOP_POSITION,
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(0, 0, 0, 0.5)",
        padding: GAME_CONFIG.TIMER_STYLE.PADDING,
        borderRadius: GAME_CONFIG.TIMER_STYLE.BORDER_RADIUS,
        color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
        fontSize: GAME_CONFIG.TIMER_STYLE.FONT_SIZE,
        fontFamily: GAME_CONFIG.UI_FONT,
        opacity,
        backdropFilter: "blur(10px)",
        fontWeight: "600",
        zIndex: 10,
      }}
    >
      {GAME_CONFIG.TIMER_FORMAT.replace(
        "{seconds}",
        Math.ceil(timeLeft).toString(),
      )}
    </div>
  );
};
