# Frasberg AI Fork System v1.0.0

Complete documentation for the Frasberg AI Fork System - a framework for domain-specific AI agent extensions with strict scope boundaries.

## Overview

The Fork System enables Frasberg AI to operate safely in specialized domains (education, healthcare) while maintaining absolute boundaries around prohibited capabilities.

## Architecture

```
frasberg-ai/
├── forks/                              # Domain-specific forks
│   ├── education/                      # Education fork
│   │   ├── domain/
│   │   │   ├── scope.md               # Scope boundaries document
│   │   │   ├── disclosures.md         # Required disclosures
│   │   │   ├── personas.py            # Education personas
│   │   │   └── policies.py            # Policy enforcement
│   │   ├── simulation/
│   │   │   ├── classroom.py           # Classroom simulation
│   │   │   └── roles.py               # Role definitions
│   │   └── tests/
│   │       └── test_scope_integrity.py # Scope tests
│   │
│   └── healthcare-nonclinical/         # Healthcare (non-clinical) fork
│       ├── domain/
│       │   ├── scope.md               # STRICT scope boundaries
│       │   ├── disclosures.md         # Safety disclosures
│       │   ├── personas.py            # Non-clinical personas
│       │   └── policies.py            # CRITICAL policy enforcement
│       ├── simulation/
│       │   ├── intake.py              # Intake simulation
│       │   └── bedside.py             # Bedside support simulation
│       └── tests/
│           └── test_nonclinical_scope.py # Critical scope tests
│
├── backend/app/deployment/airgap/      # Air-gapped deployment
│   ├── config.py                       # Air-gap configuration
│   ├── validator.py                    # Network isolation validator
│   └── __init__.py
│
├── .github/workflows/
│   └── fork-guard.yml                  # CI fork isolation guard
│
└── system-manifest.json                # Complete system manifest
```

## Forks

### 1. Education Fork

**Purpose:** Provide educational support while maintaining ethical boundaries.

**In Scope:**
- Lesson planning assistance
- Instructional design support
- Student learning support (non-evaluative)
- Classroom management support
- Educational resource curation

**Strictly Prohibited:**
- Grade assignment
- Student evaluation
- Educational placement decisions
- Disciplinary actions
- Student record access (FERPA protected)

**Compliance:**
- FERPA (Family Educational Rights and Privacy Act)
- COPPA (Children's Online Privacy Protection Act)
- Educational ethics standards

**Personas:**
- Instructional Designer
- Student Support (Elementary, Middle, High School, College)
- Classroom Management
- Professional Development

**Safety Features:**
- Student safety detection
- Academic integrity enforcement
- Age-appropriate interactions
- Mandatory disclosures

### 2. Healthcare Non-Clinical Fork

**Purpose:** Provide ONLY non-clinical administrative support in healthcare settings.

**⚠️ CRITICAL: This is NOT a medical system**

**In Scope:**
- Administrative support (scheduling, etc.)
- Patient communication (non-clinical)
- Facility wayfinding
- General health education (vetted, non-diagnostic)
- Non-clinical comfort support

**STRICTLY PROHIBITED:**
- Medical diagnosis ❌
- Treatment recommendations ❌
- Clinical decision-making ❌
- Medication advice ❌
- Symptom assessment ❌
- Emergency response ❌
- PHI/medical record access ❌
- Test result interpretation ❌

**Compliance:**
- HIPAA (Health Insurance Portability and Accountability Act)
- HITECH Act
- State medical practice acts
- Patient safety regulations

**Personas:**
- Administrative Assistant
- Patient Navigator
- Health Educator (general only)
- Appointment Scheduler
- Bedside Support (non-clinical)

**Safety Features:**
- Emergency detection and immediate escalation
- Clinical query rejection
- Mental health crisis detection
- PHI protection
- Multi-layer scope enforcement
- Mandatory medical disclaimers

**Emergency Resources:**
- Medical Emergency: 911
- Suicide/Crisis: 988
- Poison Control: 1-800-222-1222

## Key Components

### Domain Scope Documents

Each fork has a detailed scope document (`domain/scope.md`) that defines:
- Exact in-scope capabilities
- Strictly prohibited actions
- Disclosure requirements
- Ethical boundaries
- Compliance requirements
- Human-in-the-loop requirements
- Technical implementation details

### Policy Enforcement

Policy engines (`domain/policies.py`) provide:
- Real-time request validation
- Keyword-based detection
- Pattern matching for violations
- Immediate rejection of out-of-scope requests
- Audit logging
- Escalation protocols

### Personas

Domain-specific personas (`domain/personas.py`) include:
- Role definitions
- Capability boundaries
- Automatic disclosure generation
- Age/context-appropriate adaptations
- Risk level awareness

### Disclosures

Required disclosure templates (`domain/disclosures.md`) ensure:
- Transparency about AI capabilities
- Clear limitation communication
- Appropriate emergency resources
- Age-appropriate messaging
- Compliance with regulations

### Simulations

Safe testing environments (`simulation/*.py`) provide:
- Domain-specific scenarios
- No real user data
- Policy validation
- Scope integrity testing

## Deployment Modes

### Standard Deployment
- Full network access
- Automatic updates
- Standard monitoring

### Restricted Deployment
- Internal network only
- Manual updates with verification
- Internal monitoring only

### Air-Gapped Deployment
- **Complete network isolation**
- Manual updates via physical media
- Local monitoring only
- Network isolation validator required

**Air-Gap Configuration:**
```python
from backend.app.deployment.airgap import create_full_airgap_config

config = create_full_airgap_config(
    deployment_id='secure-facility-001',
    local_model_path='/opt/frasberg/models',
    local_data_path='/opt/frasberg/data',
    allowed_internal_ips=['10.0.0.0/8']
)
```

**Validation:**
```python
from backend.app.deployment.airgap import validate_airgap_deployment

is_compliant, report = validate_airgap_deployment(strict_mode=True)
print(report)
```

## CI/CD Fork Guard

The Fork Guard workflow (`.github/workflows/fork-guard.yml`) ensures:

1. **Fork Isolation:** Fork branches can ONLY modify files in their fork directory
2. **Core Protection:** Fork branches cannot modify core system files
3. **Structure Validation:** Enforces required fork directory structure
4. **Scope Enforcement:** Verifies policy enforcement code exists

**Usage:**
- Create fork branches as: `fork/education/*` or `fork/healthcare/*`
- Fork Guard automatically validates all PRs
- Violations block merge

## Testing

### Scope Integrity Tests

Each fork includes comprehensive scope integrity tests:

**Education:**
```bash
pytest forks/education/tests/test_scope_integrity.py -v
```

**Healthcare:**
```bash
pytest forks/healthcare-nonclinical/tests/test_nonclinical_scope.py -v
```

**Test Coverage:**
- Policy enforcement
- Persona boundaries
- Disclosure delivery
- Compliance requirements
- Safety feature validation

## Security

### Isolation Layers

1. **Fork-to-Fork:** Complete isolation - forks cannot access each other
2. **Fork-to-Core:** Read-only - forks cannot modify core
3. **Core-to-Fork:** Controlled - core manages fork lifecycle

### Data Protection

**Education Fork:**
- No access to FERPA-protected student records
- No student PII storage
- Privacy-first design

**Healthcare Fork:**
- Zero access to PHI (Protected Health Information)
- No medical record access
- HIPAA-compliant by design

### Audit Logging

All systems log:
- Policy violations
- Escalations
- Scope boundary attempts
- Emergency situations

## Usage Examples

### Education Fork

```python
from forks.education.domain.personas import get_persona
from forks.education.domain.policies import get_policy_engine

# Get a persona
persona = get_persona("student_support_high")
disclosure = persona.get_disclosure()

# Validate a request
policy_engine = get_policy_engine()
is_valid, violation = policy_engine.validate_request(
    "Can you help me understand quadratic equations?"
)

if is_valid:
    # Process request
    pass
else:
    # Show violation message to user
    print(violation.user_message)
```

### Healthcare Fork

```python
from forks.healthcare_nonclinical.domain.personas import get_persona
from forks.healthcare_nonclinical.domain.policies import get_healthcare_policy_engine

# Get a persona
persona = get_persona("administrative_assistant")
safety_disclosure = persona.get_safety_disclosure()

# Validate a request (STRICT enforcement)
policy_engine = get_healthcare_policy_engine()
is_valid, violation = policy_engine.validate_request(
    "Can you help me schedule an appointment?"
)

if is_valid:
    # Process administrative request
    pass
else:
    # Show safety message and escalate if needed
    print(violation.user_message)
    if violation.requires_immediate_escalation:
        # Escalate to appropriate resource
        pass
```

## Creating a New Fork

1. Create fork directory structure:
```bash
mkdir -p forks/new-domain/{domain,simulation,tests}
```

2. Create required files:
   - `domain/scope.md` - Define scope boundaries
   - `domain/disclosures.md` - Define disclosures
   - `domain/personas.py` - Create personas
   - `domain/policies.py` - Implement policy enforcement
   - `simulation/*.py` - Create simulations
   - `tests/test_*.py` - Write scope integrity tests

3. Update `system-manifest.json`

4. Create fork branch: `fork/new-domain/initial-setup`

5. Fork Guard will validate structure

## Governance

### Ownership
- **Education Fork:** Education Domain Team
- **Healthcare Fork:** Healthcare Non-Clinical Domain Team + Clinical Advisory

### Review Cycles
- **Education:** Quarterly
- **Healthcare:** Monthly (high-risk domain)

### Change Approval
- **Core:** Architecture team
- **Forks:** Domain team + compliance review

## System Manifest

The complete system manifest (`system-manifest.json`) documents:
- All capabilities and limitations
- Compliance requirements
- Deployment modes
- Security measures
- Testing requirements
- Governance structure

## Important Limitations

### General
- AI system, not a replacement for human professionals
- Operates within defined scope boundaries only
- Requires human oversight for critical decisions
- Not suitable for emergency situations

### Education Fork
- Cannot replace educator professional judgment
- Cannot access or store student records
- Cannot assign grades or make educational placements
- Cannot implement disciplinary actions

### Healthcare Fork
- **NOT a medical device**
- **NOT FDA-cleared for clinical use**
- Cannot diagnose, treat, or provide medical advice
- Cannot access protected health information
- Cannot replace healthcare professionals
- **NOT for emergencies - call 911**

## Support

For questions or issues:
- Education Fork: Education Domain Team
- Healthcare Fork: Healthcare Domain Team
- Core System: Architecture Team
- Security: Security Team

## Version

**Version:** 1.0.0  
**Status:** Production Ready  
**Release Date:** 2024

---

**Remember:** Safety first. When in doubt, escalate to human professionals.
