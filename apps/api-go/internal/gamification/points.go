package gamification

import (
	"github.com/typing-code-learn/api-go/internal/models"
)

// PointStrategy defines how points are calculated
type PointStrategy interface {
	Calculate(metrics models.TypingMetrics) int
}

// DefaultPointStrategy implements a standard point calculation
type DefaultPointStrategy struct {
	BasePointsPerChar float64
	WPMValidation     float64 // Minimum WPM to count
	AccuracyThreshold float64 // Minimum accuracy to count
}

// Calculate computes the points for a given session based on metrics
func (s *DefaultPointStrategy) Calculate(metrics models.TypingMetrics) int {
	if metrics.Accuracy < s.AccuracyThreshold {
		return 0
	}

	// Base score: Correct characters typed
	baseScore := float64(metrics.CorrectChars) * s.BasePointsPerChar

	// Speed multiplier: (WPM / 10) * 0.5
	// Example: 60 WPM -> 3.0 multiplier bonus (if we want high variance)
	// Let's us a more stable multiplier: 1 + (WPM / 100)
	// 60 WPM -> 1.6x multiplier
	// 100 WPM -> 2.0x multiplier
	speedMultiplier := 1.0 + (metrics.WPM / 100.0)

	// Accuracy multiplier: (Accuracy / 100) ^ 2 to punish low accuracy heavily
	accuracyMultiplier := (metrics.Accuracy / 100.0) * (metrics.Accuracy / 100.0)

	finalScore := baseScore * speedMultiplier * accuracyMultiplier

	return int(finalScore)
}

// NewDefaultStrategy creates a strategy with sensible defaults
func NewDefaultStrategy() *DefaultPointStrategy {
	return &DefaultPointStrategy{
		BasePointsPerChar: 1.0,
		WPMValidation:     10.0,
		AccuracyThreshold: 80.0,
	}
}

// RankTier defines a level in the ranking system
type RankTier string

const (
	TierNovice   RankTier = "Novice"
	TierApprentice RankTier = "Apprentice"
	TierCoder    RankTier = "Coder"
	TierHacker   RankTier = "Hacker"
	TierGuru     RankTier = "Guru"
)

// GetTier returns the tier based on total points
func GetTier(totalPoints int) RankTier {
	switch {
	case totalPoints >= 100000:
		return TierGuru
	case totalPoints >= 50000:
		return TierHacker
	case totalPoints >= 10000:
		return TierCoder
	case totalPoints >= 1000:
		return TierApprentice
	default:
		return TierNovice
	}
}
