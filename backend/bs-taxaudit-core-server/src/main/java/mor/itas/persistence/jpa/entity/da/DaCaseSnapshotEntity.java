package mor.itas.persistence.jpa.entity.da;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.GenericGenerator;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "da_case_snapshots")
@Data
public class DaCaseSnapshotEntity {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "case_id", nullable = false, unique = true)
    private UUID caseId;

    @Column(name = "snapshot_data", columnDefinition = "TEXT")
    private String snapshotData;

    @Column(name = "last_saved_at")
    private OffsetDateTime lastSavedAt;
}
