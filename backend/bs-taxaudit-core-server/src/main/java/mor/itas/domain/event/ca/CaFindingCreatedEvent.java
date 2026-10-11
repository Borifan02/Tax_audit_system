package mor.itas.domain.event.ca;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FR-04.4-10, 33 — A formal audit finding has been created.
 * Includes full financial impact (principal + 20% penalty + interest).
 * Multi-zone taxpayers must supply a zoneCode (FR-04.4-33).
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CaFindingCreatedEvent {
    private UUID       caseId;
    private UUID       findingId;
    private String     findingReference;  // CA-XXXXXX-F01
    private String     auditArea;         // REVENUE | PURCHASES | PAYROLL | VAT | CIT …
    private String     title;
    private String     taxType;           // CIT | VAT | PAYE | WHT
    private BigDecimal underDeclaredAmount;
    private BigDecimal penaltyAmount;
    private BigDecimal totalTaxImpact;
    private boolean    isSignificant;
    private boolean    indicatesFraud;
    private String     zoneCode;          // nullable — for multi-zone taxpayers
    private UUID       caatExceptionId;   // nullable — set when converted from CAAT exception
    private String     createdById;
    @Builder.Default private LocalDateTime timestamp = LocalDateTime.now();
}
