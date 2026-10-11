package mor.itas.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * SpringDoc OpenAPI configuration.
 * Swagger UI available at: http://localhost:8080/swagger-ui/index.html
 * OpenAPI JSON at:         http://localhost:8080/v3/api-docs
 *
 * Grouped APIs:
 *   /api-docs/comprehensive-audit → /api/v1/backoffice/ca/**
 *   /api-docs/desk-audit          → /api/v1/backoffice/desk-audit/**
 *   /api-docs/annual-planning     → /api/v1/backoffice/ap/**
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("ITAS Tax Audit System API")
                .version("1.0.0")
                .description("Integrated Tax Administration System — Tax Audit Subsystem REST API. " +
                    "Covers Annual Planning (AP), Desk Audit (DA), Comprehensive Audit (CA), " +
                    "Transfer Pricing (TP), Joint Audit (JAC), and Quality Assurance (QA) modules.")
                .contact(new Contact()
                    .name("MoR Engineering")
                    .email("engineering@mor.gov.et"))
                .license(new License()
                    .name("Internal — Ministry of Revenue Ethiopia")))
            .servers(List.of(
                new Server().url("http://localhost:8080").description("Development Server"),
                new Server().url("http://localhost:3000/api").description("Frontend Proxy")));
    }

    /**
     * Comprehensive Audit API group — all FR-04.4 endpoints.
     * Access at: /swagger-ui/index.html?urls.primaryName=comprehensive-audit
     */
    @Bean
    public GroupedOpenApi comprehensiveAuditApi() {
        return GroupedOpenApi.builder()
            .group("comprehensive-audit")
            .displayName("Comprehensive Audit (FR-04.4)")
            .pathsToMatch("/api/v1/backoffice/ca/**")
            .build();
    }

    /**
     * Annual Planning & Cases API group.
     */
    @Bean
    public GroupedOpenApi annualPlanningApi() {
        return GroupedOpenApi.builder()
            .group("annual-planning")
            .displayName("Annual Planning & Case Management")
            .pathsToMatch("/api/v1/backoffice/ap/**")
            .build();
    }

    /**
     * Desk Audit API group.
     */
    @Bean
    public GroupedOpenApi deskAuditApi() {
        return GroupedOpenApi.builder()
            .group("desk-audit")
            .displayName("Desk Audit (FR-04.3)")
            .pathsToMatch("/api/v1/backoffice/da/**")
            .build();
    }

    /**
     * Transfer Pricing API group.
     */
    @Bean
    public GroupedOpenApi transferPricingApi() {
        return GroupedOpenApi.builder()
            .group("transfer-pricing")
            .displayName("Transfer Pricing Audit (FR-04.5)")
            .pathsToMatch("/api/v1/backoffice/tp/**")
            .build();
    }

    /**
     * Joint Audit Committee API group.
     */
    @Bean
    public GroupedOpenApi jointAuditApi() {
        return GroupedOpenApi.builder()
            .group("joint-audit")
            .displayName("Joint Audit Committee (JAC)")
            .pathsToMatch("/api/v1/backoffice/ap/committee/**", "/api/v1/backoffice/cases/**")
            .build();
    }

    /**
     * Quality Assurance API group.
     */
    @Bean
    public GroupedOpenApi qualityAssuranceApi() {
        return GroupedOpenApi.builder()
            .group("quality-assurance")
            .displayName("Quality Assurance (QA)")
            .pathsToMatch("/api/v1/backoffice/qa/**")
            .build();
    }
}
