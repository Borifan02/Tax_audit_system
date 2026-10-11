#!/usr/bin/env python3
"""
ITAS Tax Audit System - Postman Collection v2.1 Generator, Validator & Live Executor
Generates:
  1. ITAS_Local_Environment.postman_environment.json
  2. ITAS_Tax_Audit_Complete_API.postman_collection.json (All 42 controllers / 406 endpoints + 41-step E2E Test Suite)
  3. postman_execution_report.json (Live execution results against http://localhost:8080)
  4. ../01_QA_Package/live_test_results.json (Detailed QA test execution metrics)
"""

import json
import os
import re
import time
import urllib.request
import urllib.error

PRES_DIR = "/home/paul/itas-audit-system/all about project source document to used as raw data/collected-document-for-tax-audit-project/main resource/Presentation"
POSTMAN_DIR = os.path.join(PRES_DIR, "02_Postman_Collection")
QA_DIR = os.path.join(PRES_DIR, "01_QA_Package")

with open("/tmp/itas_controllers_inventory.json", "r", encoding="utf-8") as f:
    CONTROLLERS = json.load(f)


def api_call(method, path, body=None, headers=None):
    url = f"http://localhost:8080{path}"
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, headers=req_headers, method=method)
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            raw = r.read().decode("utf-8")
            elapsed_ms = round((time.time() - t0) * 1000, 2)
            try:
                parsed = json.loads(raw) if raw else {}
            except Exception:
                parsed = {"raw": raw[:300]}
            return r.status, elapsed_ms, parsed
    except urllib.error.HTTPError as e:
        elapsed_ms = round((time.time() - t0) * 1000, 2)
        raw = e.read().decode("utf-8") if e.fp else ""
        try:
            parsed = json.loads(raw) if raw else {}
        except Exception:
            parsed = {"error": raw[:300]}
        return e.code, elapsed_ms, parsed
    except Exception as e:
        elapsed_ms = round((time.time() - t0) * 1000, 2)
        return 0, elapsed_ms, {"error": str(e)}


# Authenticate as System Admin (admin@mor.gov.et)
_, _, login_admin = api_call("POST", "/api/v1/backoffice/auth/login", {"username": "admin@mor.gov.et", "password": "Mor@2026!"})
TOKEN = login_admin.get("token", "")
ADMIN_UID = login_admin.get("user", {}).get("userId", "00000000-0000-0000-0000-000000000001")

ENV_JSON = {
    "id": "itas-local-env-2026-v1",
    "name": "ITAS Tax Audit System - Local & Test Environment",
    "values": [
        {"key": "base_url", "value": "http://localhost:8080", "type": "default", "enabled": True},
        {"key": "api_prefix", "value": "/api/v1/backoffice", "type": "default", "enabled": True},
        {"key": "default_password", "value": "Mor@2026!", "type": "secret", "enabled": True},
        {"key": "sysadmin_username", "value": "admin@mor.gov.et", "type": "default", "enabled": True},
        {"key": "director_username", "value": "ap.director@mor.gov.et", "type": "default", "enabled": True},
        {"key": "tl_username", "value": "teamleader.berhanu.bekele@mor.gov.et", "type": "default", "enabled": True},
        {"key": "auditor_username", "value": "auditor.dawit.mengistu@mor.gov.et", "type": "default", "enabled": True},
        {"key": "qa_officer_username", "value": "qa.officer1@mor.gov.et", "type": "default", "enabled": True},
        {"key": "qa_tl_username", "value": "qa.tl1@mor.gov.et", "type": "default", "enabled": True},
        {"key": "qa_director_username", "value": "qa.director@mor.gov.et", "type": "default", "enabled": True},
        {"key": "jwt_token", "value": TOKEN, "type": "secret", "enabled": True},
        {"key": "actor_id", "value": ADMIN_UID, "type": "default", "enabled": True},
        {"key": "plan_id", "value": "cea083ef-4bb1-4fc1-a0f0-c93a3d71bbb0", "type": "default", "enabled": True},
        {"key": "case_id", "value": "c0000000-0000-0000-0000-000000000101", "type": "default", "enabled": True},
        {"key": "ca_case_id", "value": "c0000000-0000-0000-0000-000000000101", "type": "default", "enabled": True},
        {"key": "da_case_id", "value": "fbca61b0-5cc5-4783-9900-28c06c6e47eb", "type": "default", "enabled": True},
        {"key": "ja_case_id", "value": "c4ed8958-58fa-4d9e-bc07-34f1e61e1c22", "type": "default", "enabled": True},
        {"key": "tp_case_id", "value": "9e8f8c2d-55a1-439b-9302-32510b69ae9c", "type": "default", "enabled": True},
        {"key": "issue_case_id", "value": "950fe668-a671-47c1-8474-8a9804e9ed7f", "type": "default", "enabled": True},
        {"key": "case_number", "value": "CA-2026-101", "type": "default", "enabled": True},
        {"key": "qa_case_id", "value": "QA-REV-2026-001", "type": "default", "enabled": True},
        {"key": "qa_dimension_id", "value": "DIM-01", "type": "default", "enabled": True},
        {"key": "deficiency_id", "value": "", "type": "default", "enabled": True},
        {"key": "tax_center", "value": "federal-lto1", "type": "default", "enabled": True},
        {"key": "region_code", "value": "AA", "type": "default", "enabled": True},
        {"key": "tin", "value": "09-8877665", "type": "default", "enabled": True}
    ],
    "_postman_variable_scope": "environment",
    "_postman_exported_at": "2026-10-11T22:10:00.000Z",
    "_postman_exported_using": "Postman/11.0.0"
}

with open(os.path.join(POSTMAN_DIR, "ITAS_Local_Environment.postman_environment.json"), "w", encoding="utf-8") as f:
    json.dump(ENV_JSON, f, indent=2)

ENV_VARS = {item["key"]: item["value"] for item in ENV_JSON["values"]}


def substitute_vars(text: str) -> str:
    if not text:
        return text
    out = text
    for k, v in ENV_VARS.items():
        out = out.replace(f"{{{{{k}}}}}", str(v))
    return out


def map_spring_path_to_postman(path: str) -> str:
    replacements = {
        "{planId}": "{{plan_id}}",
        "{id}": "{{case_id}}",
        "{caseId}": "{{case_id}}",
        "{auditCaseId}": "{{case_id}}",
        "{caseNumber}": "{{case_number}}",
        "{taxCenterCode}": "{{tax_center}}",
        "{taxCenter}": "{{tax_center}}",
        "{regionCode}": "{{region_code}}",
        "{tin}": "{{tin}}",
        "{userId}": "{{actor_id}}",
        "{auditorId}": "{{actor_id}}",
        "{teamLeaderId}": "{{actor_id}}",
        "{dimId}": "{{qa_dimension_id}}",
        "{defId}": "{{deficiency_id}}",
    }
    res = path
    for k, v in replacements.items():
        res = res.replace(k, v)
    res = re.sub(r"\{(\w+)\}", r":\1", res)
    return res


def make_pm_test_script(expected_codes=(200, 201), max_ms=5000, extra_js=""):
    codes_str = ", ".join(str(c) for c in expected_codes)
    lines = [
        f"pm.test('HTTP status is in [{codes_str}]', function () {{",
        f"    pm.expect([{codes_str}]).to.include(pm.response.code);",
        "});",
        f"pm.test('Response time is under {max_ms}ms', function () {{",
        f"    pm.expect(pm.response.responseTime).to.be.below({max_ms});",
        "});",
        "pm.test('Content-Type header is present', function () {",
        "    pm.expect(pm.response.headers.has('Content-Type')).to.be.true;",
        "});"
    ]
    if extra_js:
        lines.extend(extra_js.strip().splitlines())
    return [{
        "listen": "test",
        "script": {
            "type": "text/javascript",
            "exec": lines
        }
    }]


def build_postman_item(name, method, raw_path, description="", body_dict=None, expected_codes=(200, 201), extra_js="", auth_required=True):
    pm_path = map_spring_path_to_postman(raw_path)
    full_raw = f"{{{{base_url}}}}{pm_path}"
    path_parts = [p for p in pm_path.split("?")[0].strip("/").split("/") if p]
    query_items = []
    if "?" in pm_path:
        qstr = pm_path.split("?", 1)[1]
        for pair in qstr.split("&"):
            if "=" in pair:
                qk, qv = pair.split("=", 1)
                query_items.append({"key": qk, "value": qv})

    headers = [
        {"key": "Content-Type", "value": "application/json", "type": "text"},
        {"key": "Accept", "value": "application/json", "type": "text"}
    ]
    if auth_required:
        headers.extend([
            {"key": "Authorization", "value": "Bearer {{jwt_token}}", "type": "text"},
            {"key": "X-Actor-Id", "value": "{{actor_id}}", "type": "text"},
            {"key": "X-User-Id", "value": "{{actor_id}}", "type": "text"}
        ])

    req = {
        "method": method,
        "header": headers,
        "url": {
            "raw": full_raw,
            "host": ["{{base_url}}"],
            "path": path_parts,
            **({"query": query_items} if query_items else {})
        },
        "description": description or f"{method} {raw_path}"
    }
    if body_dict is not None and method in ("POST", "PUT", "PATCH"):
        req["body"] = {
            "mode": "raw",
            "raw": json.dumps(body_dict, indent=2),
            "options": {"raw": {"language": "json"}}
        }
    return {
        "name": name,
        "event": make_pm_test_script(expected_codes=expected_codes, extra_js=extra_js),
        "request": req,
        "response": []
    }


CURATED_TESTS = [
    # --- MODULE 1: AUTHENTICATION, SECURITY & RBAC ---
    {
        "id": "TC-AUTH-001",
        "module": "01. Authentication, Security & RBAC",
        "type": "Functional / Positive",
        "name": "TC-AUTH-001: Login as System Administrator (admin@mor.gov.et)",
        "method": "POST",
        "path": "/api/v1/backoffice/auth/login",
        "auth": False,
        "body": {"username": "{{sysadmin_username}}", "password": "{{default_password}}"},
        "expected": [200],
        "extra_js": "const jsonData = pm.response.json();\npm.expect(jsonData).to.have.property('token');\npm.environment.set('jwt_token', jsonData.token);\npm.environment.set('actor_id', jsonData.user.userId || jsonData.user.id);"
    },
    {
        "id": "TC-AUTH-002",
        "module": "01. Authentication, Security & RBAC",
        "type": "Security / Negative",
        "name": "TC-AUTH-002: Login with Invalid Password (401 Unauthorized & Remaining Attempts)",
        "method": "POST",
        "path": "/api/v1/backoffice/auth/login",
        "auth": False,
        "body": {"username": "qa.officer2@mor.gov.et", "password": "WrongPassword999!"},
        "expected": [401]
    },
    {
        "id": "TC-AUTH-003",
        "module": "01. Authentication, Security & RBAC",
        "type": "Security / Negative",
        "name": "TC-AUTH-003: Login with Non-Existent User Account (401 Unauthorized)",
        "method": "POST",
        "path": "/api/v1/backoffice/auth/login",
        "auth": False,
        "body": {"username": "nonexistent.hacker@mor.gov.et", "password": "{{default_password}}"},
        "expected": [401]
    },
    {
        "id": "TC-AUTH-004",
        "module": "01. Authentication, Security & RBAC",
        "type": "Functional / Positive",
        "name": "TC-AUTH-004: Login as QA Officer (Rahel Tesfaye - QA_OFFICER)",
        "method": "POST",
        "path": "/api/v1/backoffice/auth/login",
        "auth": False,
        "body": {"username": "{{qa_officer_username}}", "password": "{{default_password}}"},
        "expected": [200],
        "extra_js": "const jsonData = pm.response.json();\npm.expect(jsonData.user.userType).to.eql('QA_OFFICER');"
    },
    {
        "id": "TC-AUTH-005",
        "module": "01. Authentication, Security & RBAC",
        "type": "Functional / Positive",
        "name": "TC-AUTH-005: Login as QA Team Leader (Tewodros Mekonnen - QA_TEAM_LEADER)",
        "method": "POST",
        "path": "/api/v1/backoffice/auth/login",
        "auth": False,
        "body": {"username": "{{qa_tl_username}}", "password": "{{default_password}}"},
        "expected": [200],
        "extra_js": "const jsonData = pm.response.json();\npm.expect(jsonData.user.userType).to.eql('QA_TEAM_LEADER');"
    },
    {
        "id": "TC-AUTH-006",
        "module": "01. Authentication, Security & RBAC",
        "type": "Functional / Positive",
        "name": "TC-AUTH-006: Login as QA Director (Dr. Mesfin Alemayehu - QA_DIRECTOR)",
        "method": "POST",
        "path": "/api/v1/backoffice/auth/login",
        "auth": False,
        "body": {"username": "{{qa_director_username}}", "password": "{{default_password}}"},
        "expected": [200],
        "extra_js": "const jsonData = pm.response.json();\npm.expect(jsonData.user.userType).to.eql('QA_DIRECTOR');"
    },
    {
        "id": "TC-AUTH-007",
        "module": "01. Authentication, Security & RBAC",
        "type": "Security / Positive",
        "name": "TC-AUTH-007: Get Security Audit Log Events (System Admin Console)",
        "method": "GET",
        "path": "/api/v1/backoffice/auth/admin/security-logs",
        "auth": True,
        "expected": [200]
    },
    {
        "id": "TC-AUTH-008",
        "module": "01. Authentication, Security & RBAC",
        "type": "Functional / Positive",
        "name": "TC-AUTH-008: List All Security-Managed Users in System Admin Directory",
        "method": "GET",
        "path": "/api/v1/backoffice/auth/admin/users",
        "auth": True,
        "expected": [200]
    },
    {
        "id": "TC-AUTH-009",
        "module": "01. Authentication, Security & RBAC",
        "type": "Functional / Positive",
        "name": "TC-AUTH-009: Get Organizational Hierarchy Regions (/api/v1/regions)",
        "method": "GET",
        "path": "/api/v1/regions",
        "auth": True,
        "expected": [200]
    },

    # --- MODULE 2: ANNUAL AUDIT PLANNING & RISK ENGINE ---
    {
        "id": "TC-AP-001",
        "module": "02. Annual Audit Planning & Risk Engine",
        "type": "Functional / Positive",
        "name": "TC-AP-001: Fetch All Annual Audit Plans",
        "method": "GET",
        "path": "/api/v1/backoffice/ap/plans",
        "auth": True,
        "expected": [200]
    },
    {
        "id": "TC-AP-002",
        "module": "02. Annual Audit Planning & Risk Engine",
        "type": "Functional / Positive",
        "name": "TC-AP-002: Fetch Specific Annual Audit Plan by ID",
        "method": "GET",
        "path": "/api/v1/backoffice/ap/plans/{{plan_id}}",
        "auth": True,
        "expected": [200]
    },
    {
        "id": "TC-AP-003",
        "module": "02. Annual Audit Planning & Risk Engine",
        "type": "Negative / Boundary",
        "name": "TC-AP-003: Fetch Non-Existent Annual Plan UUID (400/404 Error Handling)",
        "method": "GET",
        "path": "/api/v1/backoffice/ap/plans/00000000-0000-0000-0000-999999999999",
        "auth": True,
        "expected": [400, 404]
    },
    {
        "id": "TC-AP-004",
        "module": "02. Annual Audit Planning & Risk Engine",
        "type": "Functional / Positive",
        "name": "TC-AP-004: Get Planning Configuration Parameters (Audit Types & Weights)",
        "method": "GET",
        "path": "/api/v1/backoffice/ap/config/planning",
        "auth": True,
        "expected": [200]
    },
    {
        "id": "TC-AP-005",
        "module": "02. Annual Audit Planning & Risk Engine",
        "type": "Functional / Positive",
        "name": "TC-AP-005: Get Director Dashboard Pending Review Plans",
        "method": "GET",
        "path": "/api/v1/backoffice/ap/plans/pending-director-review",
        "auth": True,
        "expected": [200]
    },
    {
        "id": "TC-AP-006",
        "module": "02. Annual Audit Planning & Risk Engine",
        "type": "Functional / Positive",
        "name": "TC-AP-006: Get Regional Deployed Plans (Addis Ababa - AA)",
        "method": "GET",
        "path": "/api/v1/backoffice/ap/regional/plans?regionCode={{region_code}}",
        "auth": True,
        "expected": [200]
    },
    {
        "id": "TC-AP-007",
        "module": "02. Annual Audit Planning & Risk Engine",
        "type": "Functional / Positive",
        "name": "TC-AP-007: Get Tax Center Plan Allocations (federal-lto1)",
        "method": "GET",
        "path": "/api/v1/backoffice/ap/tax-center/allocations?taxCenterId={{tax_center}}",
        "auth": True,
        "expected": [200]
    },

    # --- MODULE 3: CASE MANAGEMENT, ASSIGNMENT & HANDOFF ---
    {
        "id": "TC-CM-001",
        "module": "03. Case Management, Assignment & Handoff",
        "type": "Functional / Positive",
        "name": "TC-CM-001: List Audit Cases for Tax Center (federal-lto1)",
        "method": "GET",
        "path": "/api/v1/backoffice/ap/cases?taxCenter={{tax_center}}",
        "auth": True,
        "expected": [200]
    },
    {
        "id": "TC-CM-002",
        "module": "03. Case Management, Assignment & Handoff",
        "type": "Functional / Positive",
        "name": "TC-CM-002: Get Single Audit Case Details by Case UUID",
        "method": "GET",
        "path": "/api/v1/backoffice/ap/cases/{{ca_case_id}}",
        "auth": True,
        "expected": [200]
    },
    {
        "id": "TC-CM-003",
        "module": "03. Case Management, Assignment & Handoff",
        "type": "Functional / Positive",
        "name": "TC-CM-003: Get Team Leader Dashboard & Assigned Cases",
        "method": "GET",
        "path": "/api/v1/backoffice/ap/team-leader/dashboard?teamLeaderId=comp.tl.lto1",
        "auth": True,
        "expected": [200]
    },
    {
        "id": "TC-CM-004",
        "module": "03. Case Management, Assignment & Handoff",
        "type": "Functional / Positive",
        "name": "TC-CM-004: Get Auditor Dashboard & Active Workload",
        "method": "GET",
        "path": "/api/v1/backoffice/ap/auditor/dashboard?auditorId=comp.auditor1.lto1",
        "auth": True,
        "expected": [200]
    },
    {
        "id": "TC-CM-005",
        "module": "03. Case Management, Assignment & Handoff",
        "type": "Functional / Positive",
        "name": "TC-CM-005: Get Tax Center Taxpayers Pool (federal-lto1)",
        "method": "GET",
        "path": "/api/v1/backoffice/ap/tax-center/taxpayers?taxCenterCode={{tax_center}}&page=0&size=20",
        "auth": True,
        "expected": [200]
    },

    # --- MODULE 4: JOINT AUDIT COMMITTEE (JAC) & JOINT AUDIT EXECUTION ---
    {
        "id": "TC-JAC-001",
        "module": "04. Joint Audit Committee (JAC) & Joint Audit Execution",
        "type": "Functional / Positive",
        "name": "TC-JAC-001: Get JAC Committee Dashboard Metrics (federal-lto1)",
        "method": "GET",
        "path": "/api/v1/backoffice/ap/committee/dashboard?taxCenter={{tax_center}}",
        "auth": True,
        "expected": [200]
    },
    {
        "id": "TC-JAC-002",
        "module": "04. Joint Audit Committee (JAC) & Joint Audit Execution",
        "type": "Functional / Positive",
        "name": "TC-JAC-002: List JAC Committee Cases (Paginated)",
        "method": "GET",
        "path": "/api/v1/backoffice/ap/committee/cases?page=0&size=25&taxCenter={{tax_center}}",
        "auth": True,
        "expected": [200]
    },
    {
        "id": "TC-JAC-003",
        "module": "04. Joint Audit Committee (JAC) & Joint Audit Execution",
        "type": "Functional / Positive",
        "name": "TC-JAC-003: Search Available Auditors for Committee Nomination",
        "method": "GET",
        "path": "/api/v1/backoffice/ap/committee/auditors/search?page=0&size=25&taxCenter={{tax_center}}",
        "auth": True,
        "expected": [200]
    },
    {
        "id": "TC-JAC-004",
        "module": "04. Joint Audit Committee (JAC) & Joint Audit Execution",
        "type": "Functional / Positive",
        "name": "TC-JAC-004: List JAC Committee Deliberation Sessions",
        "method": "GET",
        "path": "/api/v1/backoffice/ap/committee/sessions?taxCenter={{tax_center}}",
        "auth": True,
        "expected": [200]
    },

    # --- MODULE 5: DESK AUDIT EXECUTION (FR-04.2) ---
    {
        "id": "TC-DA-001",
        "module": "05. Desk Audit Execution (FR-04.2)",
        "type": "Functional / Positive",
        "name": "TC-DA-001: Get Desk Audit Full Case Workspace Snapshot (da_case_id)",
        "method": "GET",
        "path": "/api/v1/backoffice/da/cases/{{da_case_id}}",
        "auth": True,
        "expected": [200]
    },
    {
        "id": "TC-DA-002",
        "module": "05. Desk Audit Execution (FR-04.2)",
        "type": "Negative / Type Guard",
        "name": "TC-DA-002: Reject Non-Desk Audit Case on Desk Audit Endpoint (Type Guard)",
        "method": "GET",
        "path": "/api/v1/backoffice/da/cases/{{ca_case_id}}",
        "auth": True,
        "expected": [400, 422, 500]
    },

    # --- MODULE 6: COMPREHENSIVE AUDIT & CAAT ENGINE (FR-04.4) ---
    {
        "id": "TC-CA-001",
        "module": "06. Comprehensive Audit & CAAT Engine (FR-04.4)",
        "type": "Functional / Positive",
        "name": "TC-CA-001: List All Comprehensive Audit Cases",
        "method": "GET",
        "path": "/api/v1/backoffice/ca/cases",
        "auth": True,
        "expected": [200]
    },
    {
        "id": "TC-CA-002",
        "module": "06. Comprehensive Audit & CAAT Engine (FR-04.4)",
        "type": "Functional / Positive",
        "name": "TC-CA-002: Get Comprehensive Audit Full Case Snapshot (Procedures, CAAT, Reconciliations)",
        "method": "GET",
        "path": "/api/v1/backoffice/ca/cases/{{ca_case_id}}",
        "auth": True,
        "expected": [200]
    },
    {
        "id": "TC-CA-003",
        "module": "06. Comprehensive Audit & CAAT Engine (FR-04.4)",
        "type": "Negative / Type Guard",
        "name": "TC-CA-003: Reject Non-Comprehensive Case on CA Endpoint (Type Guard)",
        "method": "GET",
        "path": "/api/v1/backoffice/ca/cases/{{da_case_id}}",
        "auth": True,
        "expected": [400, 422, 500]
    },

    # --- MODULE 7: TRANSFER PRICING & ISSUE AUDIT EXECUTION ---
    {
        "id": "TC-TP-001",
        "module": "07. Transfer Pricing & Issue Audit Execution",
        "type": "Functional / Positive",
        "name": "TC-TP-001: Get Transfer Pricing Execution Full State (tp_case_id)",
        "method": "GET",
        "path": "/api/v1/backoffice/tp/cases/{{tp_case_id}}/full-state",
        "auth": True,
        "expected": [200]
    },
    {
        "id": "TC-TP-002",
        "module": "07. Transfer Pricing & Issue Audit Execution",
        "type": "Functional / Positive",
        "name": "TC-TP-002: Get Transfer Pricing Strict Phase Gates (tp_case_id)",
        "method": "GET",
        "path": "/api/v1/backoffice/tp/cases/{{tp_case_id}}/phase-gates",
        "auth": True,
        "expected": [200]
    },
    {
        "id": "TC-ISS-001",
        "module": "07. Transfer Pricing & Issue Audit Execution",
        "type": "Functional / Positive",
        "name": "TC-ISS-001: Get Issue Audit Execution Details (issue_case_id)",
        "method": "GET",
        "path": "/api/v1/backoffice/issue/cases/{{issue_case_id}}",
        "auth": True,
        "expected": [200]
    },

    # --- MODULE 8: QUALITY ASSURANCE (QA) & ISO 19011 COMPLIANCE ---
    {
        "id": "TC-QA-001",
        "module": "08. Quality Assurance (QA) & ISO 19011 Compliance",
        "type": "Functional / Positive",
        "name": "TC-QA-001: List All Sampled Quality Assurance Review Cases",
        "method": "GET",
        "path": "/api/v1/backoffice/qa/cases",
        "auth": True,
        "expected": [200],
        "extra_js": "const arr = pm.response.json();\npm.expect(arr).to.be.an('array');\npm.expect(arr.length).to.be.at.least(5);"
    },
    {
        "id": "TC-QA-002",
        "module": "08. Quality Assurance (QA) & ISO 19011 Compliance",
        "type": "Functional / Positive",
        "name": "TC-QA-002: Get QA Dashboard & Compliance Statistics",
        "method": "GET",
        "path": "/api/v1/backoffice/qa/cases/stats",
        "auth": True,
        "expected": [200],
        "extra_js": "const stats = pm.response.json();\npm.expect(stats).to.have.property('totalReviews');\npm.expect(stats).to.have.property('compliancePassRate');"
    },
    {
        "id": "TC-QA-003",
        "module": "08. Quality Assurance (QA) & ISO 19011 Compliance",
        "type": "Functional / Positive",
        "name": "TC-QA-003: Get Specific QA Review Dossier with 7 ISO-19011 Dimensions (QA-REV-2026-001)",
        "method": "GET",
        "path": "/api/v1/backoffice/qa/cases/{{qa_case_id}}",
        "auth": True,
        "expected": [200],
        "extra_js": "const c = pm.response.json();\npm.expect(c.dimensions.length).to.eql(7);"
    },
    {
        "id": "TC-QA-004",
        "module": "08. Quality Assurance (QA) & ISO 19011 Compliance",
        "type": "Integration / Positive",
        "name": "TC-QA-004: Update ISO-19011 Dimension Score & Recalculate Weighted Rating (DIM-01)",
        "method": "PUT",
        "path": "/api/v1/backoffice/qa/cases/{{qa_case_id}}/dimensions/DIM-01",
        "auth": True,
        "body": {
            "score": 88,
            "status": "PASS",
            "reviewerNotes": "QA Inspector verified risk matrix and entry conference minutes against SOR FR-04.5."
        },
        "expected": [200],
        "extra_js": "const res = pm.response.json();\npm.expect(res).to.have.property('overallScore');\npm.expect(res).to.have.property('rating');"
    },
    {
        "id": "TC-QA-005",
        "module": "08. Quality Assurance (QA) & ISO 19011 Compliance",
        "type": "Integration / Positive",
        "name": "TC-QA-005: Create Statutory QA Deficiency Finding on QA Case",
        "method": "POST",
        "path": "/api/v1/backoffice/qa/cases/{{qa_case_id}}/deficiencies",
        "auth": True,
        "body": {
            "dimensionId": "DIM-04",
            "dimensionTitle": "3-Way Tax Reconciliations",
            "severity": "MAJOR",
            "title": "Unreconciled ASYCUDA Customs CIF vs GL Import Purchases Variance",
            "findingDescription": "Import declaration CIF value exceeds GL purchase ledger by ETB 2,250,000 without working paper explanation.",
            "statutoryBreach": "Tax Administration Proc. No. 983/2016 Art. 28 & MOR Audit Manual Sec. 5.3",
            "correctiveActionMandate": "Perform customs-to-GL line-item reconciliation and attach signed schedule WP-04."
        },
        "expected": [200, 201],
        "extra_js": "const def = pm.response.json();\npm.expect(def).to.have.property('id');\npm.environment.set('deficiency_id', def.id);"
    },
    {
        "id": "TC-QA-006",
        "module": "08. Quality Assurance (QA) & ISO 19011 Compliance",
        "type": "Integration / Positive",
        "name": "TC-QA-006: Generate Formal QA Review Report (qa_reports)",
        "method": "POST",
        "path": "/api/v1/backoffice/qa/cases/{{qa_case_id}}/report",
        "auth": True,
        "body": {
            "executiveSummary": "Comprehensive ISO-19011 QA evaluation completed across all 7 statutory dimensions.",
            "overallRating": "SATISFACTORY",
            "totalWeightedScore": 84,
            "criticalDeficienciesCount": 0,
            "majorDeficienciesCount": 1,
            "keyStrengths": "Complete CAAT Benford analysis||Signed entry conference minutes",
            "systemicVulnerabilities": "Customs CIF reconciliation documentation lag",
            "recommendationsForDirector": "Recommend conditional clearance upon WP-04 attachment.",
            "mandatoryCorrectiveActions": "Attach customs CIF reconciliation working paper"
        },
        "expected": [200]
    },
    {
        "id": "TC-QA-007",
        "module": "08. Quality Assurance (QA) & ISO 19011 Compliance",
        "type": "Integration / Positive",
        "name": "TC-QA-007: Fetch Underlying Field Audit Case Dossier from QA Inspector Workspace",
        "method": "GET",
        "path": "/api/v1/backoffice/qa/cases/underlying/{{ca_case_id}}",
        "auth": True,
        "expected": [200],
        "extra_js": "const d = pm.response.json();\npm.expect(d).to.have.property('auditCase');"
    },
    {
        "id": "TC-QA-008",
        "module": "08. Quality Assurance (QA) & ISO 19011 Compliance",
        "type": "Integration / Workflow",
        "name": "TC-QA-008: Execute QA Workflow Transition (SUBMIT_TO_TL)",
        "method": "POST",
        "path": "/api/v1/backoffice/qa/cases/{{qa_case_id}}/workflow",
        "auth": True,
        "body": {
            "action": "SUBMIT_TO_TL",
            "comment": "All 7 ISO-19011 dimensions evaluated and submitted for QA Team Leader supervision."
        },
        "expected": [200]
    }
]


def main():
    e2e_items = []
    for tc in CURATED_TESTS:
        e2e_items.append(
            build_postman_item(
                name=tc["name"],
                method=tc["method"],
                raw_path=tc["path"],
                description=f"[{tc['type']}] {tc['module']} - {tc['name']}",
                body_dict=tc.get("body"),
                expected_codes=tc["expected"],
                extra_js=tc.get("extra_js", ""),
                auth_required=tc.get("auth", True)
            )
        )

    folders = [
        {
            "name": "00. End-to-End Automated Test Suite (Positive, Negative, Security & Workflows)",
            "description": "Executable end-to-end test suite with automated assertions covering Authentication, Annual Planning, Case Management, JAC Committee, Desk Audit, Comprehensive Audit, Transfer Pricing, Issue Audit, and Quality Assurance.",
            "item": e2e_items
        }
    ]

    category_map = {
        "01. Identity, Auth, Users & Org Hierarchy": ["BackofficeAuthController", "UserController", "UsersMeController", "OrganizationalHierarchyController"],
        "02. Annual Audit Planning & Risk Engine": ["PlanWorkflowController", "PlanQueryController", "PlanApprovalAndDistributionController", "PlanCascadeController", "RegionalAllocationController", "TaxCenterFeedbackController", "RegionalFeedbackAggregationController", "PlanAmendmentController", "PlanningConfigController", "RiskAnalysisController", "RevenueAggregationController"],
        "03. Dashboards & Role Portals": ["DirectorDashboardController", "RegionalDashboardController", "TaxCenterDashboardController", "TeamLeaderDashboardController", "AuditorDashboardController"],
        "04. Case Management, Assignment & Handoff": ["ApAuditCaseController", "CaseManagementController", "CaseCascadeController", "CaseAssignmentController", "TaxCenterCasesController", "TaxCenterTaxpayersController", "PublicTaxpayerApiController", "AuditWorkflowController"],
        "05. Joint Audit Committee (JAC) & Collaboration": ["CommitteeController", "CommitteeSessionController", "CommitteeWorkspaceController", "CommitteeChairpersonController", "CommitteeAuditorController", "CommitteeResearchController", "CommitteeAuditTrailController"],
        "06. Desk Audit Execution (FR-04.2)": ["DeskAuditController"],
        "07. Comprehensive Audit & CAAT Engine (FR-04.4)": ["ComprehensiveAuditController"],
        "08. Transfer Pricing & Issue Audit Execution (FR-04.3 / FR-04.7)": ["TpAuditExecutionController", "TpEnhancedExecutionController", "IssueAuditExecutionController"],
        "09. Audit Quality Assurance (QA - FR-04.5 & FR-04.9.2)": ["QaController"],
        "10. Workflow Engine & Real-Time Notifications": ["WorkflowTaskController", "NotificationController"]
    }

    ctrl_by_name = {c["class"]: c for c in CONTROLLERS}
    total_catalog_endpoints = 0

    for cat_name, ctrl_names in category_map.items():
        subfolders = []
        for cname in ctrl_names:
            cinfo = ctrl_by_name.get(cname)
            if not cinfo:
                continue
            items = []
            for ep in cinfo["endpoints"]:
                m = ep["method"]
                p = ep["path"]
                sample_body = {"note": "Sample request payload"} if m in ("POST", "PUT", "PATCH") else None
                items.append(
                    build_postman_item(
                        name=f"{m} {p}",
                        method=m,
                        raw_path=p,
                        description=f"Controller: `{cname}` (`{cinfo['file']}`)\nEndpoint: `{m} {p}`",
                        body_dict=sample_body,
                        expected_codes=(200, 201, 204),
                        auth_required=not p.endswith("/auth/login")
                    )
                )
                total_catalog_endpoints += 1
            subfolders.append({
                "name": f"{cname} ({len(items)} endpoints)",
                "description": f"Source file: `{cinfo['file']}`\nBase path: `{cinfo['basePath']}`",
                "item": items
            })
        folders.append({
            "name": cat_name,
            "description": f"Complete API reference for {cat_name}",
            "item": subfolders
        })

    collection = {
        "info": {
            "_postman_id": "a9f8e7d6-c5b4-4321-9876-123456789abc",
            "name": "ITAS Tax Audit System - Complete Enterprise API Collection (406 Endpoints + E2E Test Suite)",
            "description": "Complete, importable Postman Collection v2.1 for the Ethiopian Ministry of Revenues (MOR) Integrated Tax Audit System (ITAS). Covers all 42 Spring Boot REST Controllers (406 API endpoints) plus a 41-step automated End-to-End Positive, Negative, Security & Workflow Test Suite.",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        "item": folders,
        "variable": [
            {"key": "base_url", "value": "http://localhost:8080", "type": "string"}
        ]
    }

    collection_path = os.path.join(POSTMAN_DIR, "ITAS_Tax_Audit_Complete_API.postman_collection.json")
    with open(collection_path, "w", encoding="utf-8") as f:
        json.dump(collection, f, indent=2)
    print(f"Generated {collection_path} with {len(e2e_items)} E2E tests and {total_catalog_endpoints} controller endpoints.")

    execution_results = []
    passed = 0
    failed = 0

    for tc in CURATED_TESTS:
        method = tc["method"]
        raw_path = substitute_vars(tc["path"])
        url = f"{ENV_VARS['base_url']}{raw_path}"
        headers = {"Content-Type": "application/json", "Accept": "application/json"}
        if tc.get("auth", True):
            headers["Authorization"] = f"Bearer {ENV_VARS['jwt_token']}"
            headers["X-Actor-Id"] = str(ENV_VARS["actor_id"])
            headers["X-User-Id"] = str(ENV_VARS["actor_id"])

        body_obj = tc.get("body")
        if body_obj is not None:
            body_str = substitute_vars(json.dumps(body_obj))
            data = body_str.encode("utf-8")
        else:
            data = None

        t0 = time.time()
        status_code = 0
        resp_body = {}
        try:
            req = urllib.request.Request(url, data=data, headers=headers, method=method)
            with urllib.request.urlopen(req, timeout=10) as r:
                status_code = r.status
                raw_resp = r.read().decode("utf-8")
                try:
                    resp_body = json.loads(raw_resp) if raw_resp else {}
                except Exception:
                    resp_body = {"raw": raw_resp[:200]}
        except urllib.error.HTTPError as e:
            status_code = e.code
            raw_resp = e.read().decode("utf-8") if e.fp else ""
            try:
                resp_body = json.loads(raw_resp) if raw_resp else {}
            except Exception:
                resp_body = {"error": raw_resp[:200]}
        except Exception as e:
            status_code = 0
            resp_body = {"error": str(e)}

        elapsed_ms = round((time.time() - t0) * 1000, 2)
        is_pass = status_code in tc["expected"]

        if tc["id"] == "TC-QA-005" and isinstance(resp_body, dict) and resp_body.get("id"):
            ENV_VARS["deficiency_id"] = resp_body["id"]

        if is_pass:
            passed += 1
        else:
            failed += 1

        execution_results.append({
            "testId": tc["id"],
            "module": tc["module"],
            "type": tc["type"],
            "name": tc["name"],
            "method": method,
            "endpoint": raw_path,
            "expectedStatus": tc["expected"],
            "actualStatus": status_code,
            "responseTimeMs": elapsed_ms,
            "status": "PASS" if is_pass else "FAIL"
        })
        print(f"[{'PASS' if is_pass else 'FAIL'}] {tc['id']} ({method} {raw_path}) -> HTTP {status_code} in {elapsed_ms}ms")

    # Restore QA-REV-2026-001 back to IN_REVIEW after TC-QA-008 workflow test so UI remains in clean state
    try:
        restore_req = urllib.request.Request(
            f"{ENV_VARS['base_url']}/api/v1/backoffice/qa/cases/{ENV_VARS['qa_case_id']}/workflow",
            data=json.dumps({"action": "RETURN_TO_OFFICER", "comment": "Restored to IN_REVIEW after automated E2E test run."}).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {ENV_VARS['jwt_token']}",
                "X-Actor-Id": str(ENV_VARS["actor_id"])
            },
            method="POST"
        )
        urllib.request.urlopen(restore_req, timeout=5)
        if ENV_VARS.get("deficiency_id"):
            del_req = urllib.request.Request(
                f"{ENV_VARS['base_url']}/api/v1/backoffice/qa/cases/{ENV_VARS['qa_case_id']}/deficiencies/{ENV_VARS['deficiency_id']}",
                headers={
                    "Authorization": f"Bearer {ENV_VARS['jwt_token']}",
                    "X-Actor-Id": str(ENV_VARS["actor_id"])
                },
                method="DELETE"
            )
            urllib.request.urlopen(del_req, timeout=5)
    except Exception:
        pass

    report = {
        "executedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "targetEnvironment": ENV_VARS["base_url"],
        "totalControllersInCollection": len(CONTROLLERS),
        "totalEndpointsInCollection": total_catalog_endpoints,
        "executedTestCases": len(execution_results),
        "passed": passed,
        "failed": failed,
        "passRatePercent": round((passed * 100.0) / max(1, len(execution_results)), 2),
        "averageResponseTimeMs": round(sum(r["responseTimeMs"] for r in execution_results) / max(1, len(execution_results)), 2),
        "results": execution_results
    }

    with open(os.path.join(POSTMAN_DIR, "postman_execution_report.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    with open(os.path.join(QA_DIR, "live_test_results.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(f"Summary: {passed}/{len(execution_results)} PASSED ({report['passRatePercent']}%), avg latency {report['averageResponseTimeMs']}ms")


if __name__ == "__main__":
    main()
