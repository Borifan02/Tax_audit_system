package mor.itas.persistence.jpa.entity.ca;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "ca_case_snapshots")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaCaseSnapshotEntity {

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
