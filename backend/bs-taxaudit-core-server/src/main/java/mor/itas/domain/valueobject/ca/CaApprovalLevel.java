package mor.itas.domain.valueobject.ca;

/**
 * Multi-level approval hierarchy for CA artifacts.
 * Level 1 = Team Leader, Level 2 = Audit Director.
 * FR-04.4-18.
 */
public enum CaApprovalLevel {
    TEAM_LEADER(1),
    DIRECTOR(2);

    private final int level;

    CaApprovalLevel(int level) { this.level = level; }

    public int getLevel() { return level; }

    public static CaApprovalLevel fromInt(int level) {
        for (CaApprovalLevel l : values()) {
            if (l.level == level) return l;
        }
        throw new IllegalArgumentException("Unknown approval level: " + level);
    }
}
