import React from "react";
import { interpolate, spring, useCurrentFrame } from "remotion";
import { GAME_CONFIG } from "../constants/game";

interface ScoreboardProps {
  yesScore: number;
  noScore: number;
}

interface TimerProps {
  timeLeft: number;
}

// Composant Commentaire TikTok
export const Comment: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = spring({
    frame,
    fps: 30,
    config: {
      damping: 200,
    },
  });

  return (
    <div
      style={{
        position: "absolute",
        top: "5%",
        left: "50%",
        transform: "translateX(-50%)",
        opacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "8px",
        width: "auto",
      }}
    >
      {/* Avatar et ID */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: GAME_CONFIG.COLORS.TEXT_SECONDARY,
          fontSize: "14px",
          fontFamily: GAME_CONFIG.UI_FONT,
        }}
      >
        <div
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: "#666",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span>👤</span>
        </div>
        <span>0x456c6961737a · 2h ago</span>
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
        }}
      >
        {GAME_CONFIG.COMMENT_TEXT}
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          color: GAME_CONFIG.COLORS.TEXT_SECONDARY,
          fontSize: "14px",
          fontFamily: GAME_CONFIG.UI_FONT,
        }}
      >
        <span>❤️ 0</span>
        <span>Reply</span>
        <span>Delete</span>
      </div>
    </div>
  );
};

// Composant Scoreboard
export const Scoreboard: React.FC<ScoreboardProps> = ({
  yesScore,
  noScore,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: "25%",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: "12px",
        fontFamily: GAME_CONFIG.UI_FONT,
      }}
    >
      <div
        style={{
          background: GAME_CONFIG.COLORS.SCORE_YES_BG,
          padding: GAME_CONFIG.SCORE_STYLE.PADDING,
          borderRadius: GAME_CONFIG.SCORE_STYLE.BORDER_RADIUS,
          color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
          fontSize: GAME_CONFIG.SCORE_STYLE.FONT_SIZE,
          fontWeight: "bold",
        }}
      >
        {GAME_CONFIG.SCORE_FORMAT.YES.replace("{score}", yesScore.toString())}
      </div>
      <div
        style={{
          background: GAME_CONFIG.COLORS.SCORE_NO_BG,
          padding: GAME_CONFIG.SCORE_STYLE.PADDING,
          borderRadius: GAME_CONFIG.SCORE_STYLE.BORDER_RADIUS,
          color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
          fontSize: GAME_CONFIG.SCORE_STYLE.FONT_SIZE,
          fontWeight: "bold",
        }}
      >
        {GAME_CONFIG.SCORE_FORMAT.NO.replace("{score}", noScore.toString())}
      </div>
    </div>
  );
};

// Composant Timer
export const Timer: React.FC<TimerProps> = ({ timeLeft }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: "35%",
        left: "50%",
        transform: "translateX(-50%)",
        color: GAME_CONFIG.COLORS.TEXT_PRIMARY,
        fontSize: GAME_CONFIG.TIMER_STYLE.FONT_SIZE,
        fontFamily: GAME_CONFIG.UI_FONT,
        fontWeight: "bold",
        background: "rgba(0, 0, 0, 0.5)",
        padding: GAME_CONFIG.TIMER_STYLE.PADDING,
        borderRadius: GAME_CONFIG.TIMER_STYLE.BORDER_RADIUS,
        backdropFilter: "blur(10px)",
      }}
    >
      {GAME_CONFIG.TIMER_FORMAT.replace(
        "{seconds}",
        Math.ceil(timeLeft).toString(),
      )}
    </div>
  );
};
