package mor.itas.persistence.jpa.entity.ap;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * JPA Entity for t_user table
 * Stores all system users — team leaders, auditors, committee members.
 * Replaces the in-memory MockUserRepository.
 */
@Entity(name = "ApUserEntity")
@Table(name = "t_user")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserEntity {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "username", nullable = false, unique = true, length = 100)
    private String username;

    @Column(name = "email", nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;

    @Column(name = "user_type", nullable = false, length = 50)
    private String userType;

    @Column(name = "audit_type", length = 50)
    private String auditType;

    @Column(name = "assigned_level", nullable = false, length = 50)
    @Builder.Default
    private String assignedLevel = "TAX_CENTER";

    @Column(name = "assigned_location", length = 100)
    private String assignedLocation;

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Column(name = "must_change_password")
    @Builder.Default
    private Boolean mustChangePassword = false;

    @Column(name = "failed_login_count")
    @Builder.Default
    private Integer failedLoginCount = 0;

    @Column(name = "locked_until")
    private OffsetDateTime lockedUntil;

    @Column(name = "last_login_at")
    private OffsetDateTime lastLoginAt;

    @Column(name = "password_changed_at")
    private OffsetDateTime passwordChangedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (userId == null) {
            userId = UUID.randomUUID();
        }
    }

    /**
     * Convert to domain model User
     */
    public mor.itas.domain.model.ap.User toDomain() {
        return new mor.itas.domain.model.ap.User(
            userId, username, email, fullName, userType,
            auditType, assignedLevel, assignedLocation,
            status, createdAt, updatedAt, null
        );
    }

    /**
     * Create entity from domain model User
     */
    public static UserEntity fromDomain(mor.itas.domain.model.ap.User user) {
        return UserEntity.builder()
            .userId(user.getUserId())
            .username(user.getUsername())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .userType(user.getUserType())
            .auditType(user.getAuditType())
            .assignedLevel(user.getAssignedLevel())
            .assignedLocation(user.getAssignedLocation())
            .status(user.getStatus())
            .build();
    }
}
