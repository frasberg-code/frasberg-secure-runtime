# Frasberg Fork System - Documentation Index

Quick reference guide to all Fork System documentation and components.

## 📚 Main Documentation

### Overview Documents
- **[FORK_SYSTEM_README.md](./FORK_SYSTEM_README.md)** - Complete guide to the Fork System
- **[FORK_SYSTEM_SUMMARY.md](./FORK_SYSTEM_SUMMARY.md)** - Implementation summary and statistics
- **[system-manifest.json](./system-manifest.json)** - Complete system manifest (JSON)

## 🎓 Education Fork

### Location: `forks/education/`

#### Domain Definition
- **[scope.md](./forks/education/domain/scope.md)** - Scope boundaries and capabilities
- **[disclosures.md](./forks/education/domain/disclosures.md)** - Required disclosure templates
- **[personas.py](./forks/education/domain/personas.py)** - 7 education-specific personas
- **[policies.py](./forks/education/domain/policies.py)** - Policy enforcement engine

#### Simulations
- **[classroom.py](./forks/education/simulation/classroom.py)** - Classroom simulation
- **[roles.py](./forks/education/simulation/roles.py)** - Educational role definitions

#### Testing
- **[test_scope_integrity.py](./forks/education/tests/test_scope_integrity.py)** - 39 scope tests

#### Key Features
- ✅ FERPA compliance
- ✅ Age-appropriate interactions (K-12, College)
- ✅ Academic integrity enforcement
- ✅ Student safety detection
- ✅ NO grading, NO student records, NO disciplinary actions

## 🏥 Healthcare Non-Clinical Fork

### Location: `forks/healthcare-nonclinical/`

#### Domain Definition
- **[scope.md](./forks/healthcare-nonclinical/domain/scope.md)** - STRICT non-clinical scope
- **[disclosures.md](./forks/healthcare-nonclinical/domain/disclosures.md)** - Safety-critical disclosures
- **[personas.py](./forks/healthcare-nonclinical/domain/personas.py)** - 5 non-clinical personas
- **[policies.py](./forks/healthcare-nonclinical/domain/policies.py)** - Multi-layer policy enforcement

#### Simulations
- **[intake.py](./forks/healthcare-nonclinical/simulation/intake.py)** - Patient intake (administrative)
- **[bedside.py](./forks/healthcare-nonclinical/simulation/bedside.py)** - Bedside support (non-clinical)

#### Testing
- **[test_nonclinical_scope.py](./forks/healthcare-nonclinical/tests/test_nonclinical_scope.py)** - 45+ critical tests

#### Key Features
- ✅ HIPAA compliance
- ✅ Emergency detection (911, 988, Poison Control)
- ✅ PHI protection
- ✅ Mental health crisis response
- ⚠️  NO diagnosis, NO treatment, NO medical advice
- ⚠️  NOT a medical device

## 🔒 Air-Gapped Deployment

### Location: `backend/app/deployment/airgap/`

#### Components
- **[__init__.py](./backend/app/deployment/airgap/__init__.py)** - Module exports
- **[config.py](./backend/app/deployment/airgap/config.py)** - Deployment configuration
- **[validator.py](./backend/app/deployment/airgap/validator.py)** - Network isolation validator

#### Deployment Modes
1. **Standard** - Full network access
2. **Restricted** - Internal network only
3. **Full Air-Gap** - Complete isolation

#### Key Features
- ✅ Network isolation validation
- ✅ Offline operation support
- ✅ Manual update verification
- ✅ Configuration validation

## ⚙️ CI/CD Integration

### Fork Guard Workflow
- **[fork-guard.yml](./.github/workflows/fork-guard.yml)** - CI fork isolation enforcement

#### What It Does
- ✅ Detects fork branches (`fork/*`)
- ✅ Prevents core modification
- ✅ Validates fork structure
- ✅ Verifies scope enforcement code
- ✅ Blocks violations

## 📋 Quick Reference

### Running Tests

**Education Fork:**
```bash
pytest forks/education/tests/test_scope_integrity.py -v
```

**Healthcare Fork:**
```bash
pytest forks/healthcare-nonclinical/tests/test_nonclinical_scope.py -v
```

### Using Personas

**Education Example:**
```python
from forks.education.domain.personas import get_persona

persona = get_persona("student_support_high")
disclosure = persona.get_disclosure()
```

**Healthcare Example:**
```python
from forks.healthcare_nonclinical.domain.personas import get_persona

persona = get_persona("administrative_assistant")
safety_disclosure = persona.get_safety_disclosure()
```

### Policy Validation

**Education Example:**
```python
from forks.education.domain.policies import get_policy_engine

policy_engine = get_policy_engine()
is_valid, violation = policy_engine.validate_request("Can you help me plan a lesson?")
```

**Healthcare Example:**
```python
from forks.healthcare_nonclinical.domain.policies import get_healthcare_policy_engine

policy_engine = get_healthcare_policy_engine()
is_valid, violation = policy_engine.validate_request("Can you schedule an appointment?")
```

### Air-Gap Deployment

**Create Configuration:**
```python
from backend.app.deployment.airgap import create_full_airgap_config

config = create_full_airgap_config(
    deployment_id='secure-001',
    local_model_path='/opt/frasberg/models',
    local_data_path='/opt/frasberg/data'
)
```

**Validate Isolation:**
```python
from backend.app.deployment.airgap import validate_airgap_deployment

is_compliant, report = validate_airgap_deployment(strict_mode=True)
print(report)
```

## 🎯 Use Cases

### Education Fork Use Cases
1. Lesson planning assistance
2. Student learning support (non-evaluative)
3. Classroom management support
4. Professional development for teachers
5. Instructional design guidance

### Healthcare Fork Use Cases
1. Appointment scheduling
2. Facility wayfinding
3. Patient portal support
4. General health education (non-diagnostic)
5. Administrative question answering

## 🚫 What NOT to Use For

### Education Fork - NEVER Use For:
- Assigning grades
- Accessing student records
- Making educational placements
- Disciplinary decisions
- Replacing teacher judgment

### Healthcare Fork - NEVER Use For:
- Medical diagnosis
- Treatment recommendations
- Medication advice
- Symptom assessment
- Emergency situations (call 911)
- Accessing medical records

## 📊 System Statistics

- **Total Files:** 24
- **Lines of Code:** 12,000+
- **Test Cases:** 84+
- **Personas:** 12
- **Documentation Words:** 25,000+
- **Deployment Modes:** 3

## 🔐 Compliance

### Education
- FERPA (Family Educational Rights and Privacy Act)
- COPPA (Children's Online Privacy Protection Act)
- Educational ethics standards

### Healthcare
- HIPAA (Health Insurance Portability and Accountability Act)
- HITECH Act
- State medical practice acts
- Patient safety regulations

## 📞 Emergency Resources

### Healthcare Fork Emergency Numbers
- **Medical Emergency:** 911
- **Suicide/Crisis:** 988
- **Poison Control:** 1-800-222-1222
- **Domestic Violence:** 1-800-799-7233

## 🔄 Version Information

- **Version:** 1.0.0
- **Status:** Production Ready
- **Release:** 2024

## 🤝 Contributing

For new forks or modifications:
1. Review existing fork structure
2. Follow scope definition patterns
3. Implement policy enforcement
4. Create comprehensive tests
5. Document thoroughly

## ℹ️ Support

- **Education Fork:** Education Domain Team
- **Healthcare Fork:** Healthcare Domain Team + Clinical Advisory
- **Core System:** Architecture Team
- **Security:** Security Team

---

**Last Updated:** 2024  
**Maintained By:** Frasberg Team
