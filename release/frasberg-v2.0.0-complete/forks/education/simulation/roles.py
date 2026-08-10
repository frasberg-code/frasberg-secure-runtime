"""
Education Fork - Role Definitions

Defines roles for educational simulations and interactions.
"""

from typing import List, Dict, Optional
from dataclasses import dataclass, field
from enum import Enum


class EducationalRole(Enum):
    """Roles in educational contexts."""
    TEACHER = "teacher"
    STUDENT = "student"
    TEACHING_ASSISTANT = "teaching_assistant"
    INSTRUCTIONAL_COACH = "instructional_coach"
    CURRICULUM_COORDINATOR = "curriculum_coordinator"
    SPECIAL_EDUCATOR = "special_educator"
    ADMINISTRATOR = "administrator"
    PARENT = "parent"


@dataclass
class RoleDefinition:
    """Base definition for an educational role."""
    
    role_type: EducationalRole
    name: str
    description: str
    
    # Permissions and capabilities
    can_access: List[str] = field(default_factory=list)
    cannot_access: List[str] = field(default_factory=list)
    
    # Interaction patterns
    typical_tasks: List[str] = field(default_factory=list)
    support_needs: List[str] = field(default_factory=list)
    
    # AI assistance scope
    ai_can_help_with: List[str] = field(default_factory=list)
    ai_cannot_help_with: List[str] = field(default_factory=list)


# Role definitions for common educational roles

TEACHER_ROLE = RoleDefinition(
    role_type=EducationalRole.TEACHER,
    name="Classroom Teacher",
    description="Primary educator responsible for instruction and student learning",
    can_access=[
        "lesson_planning_tools",
        "instructional_resources",
        "classroom_management_support",
        "assessment_design_tools",
        "communication_templates",
        "professional_development_resources"
    ],
    cannot_access=[
        "other_teachers_evaluations",
        "confidential_administrative_data",
        "system_wide_policy_changes"
    ],
    typical_tasks=[
        "Planning lessons",
        "Delivering instruction",
        "Assessing student learning",
        "Managing classroom",
        "Communicating with parents",
        "Collaborating with colleagues"
    ],
    support_needs=[
        "Time-saving tools",
        "Differentiation strategies",
        "Resource recommendations",
        "Organizational support",
        "Pedagogical guidance"
    ],
    ai_can_help_with=[
        "Generate lesson plan templates",
        "Suggest teaching strategies",
        "Create activity ideas",
        "Draft communication templates",
        "Organize resources",
        "Design assessment rubrics"
    ],
    ai_cannot_help_with=[
        "Assign grades to students",
        "Make educational placement decisions",
        "Access student records",
        "Implement disciplinary actions",
        "Replace professional judgment"
    ]
)

STUDENT_ROLE = RoleDefinition(
    role_type=EducationalRole.STUDENT,
    name="Student Learner",
    description="Individual engaged in learning activities",
    can_access=[
        "learning_resources",
        "study_support",
        "concept_explanations",
        "practice_materials",
        "learning_strategies"
    ],
    cannot_access=[
        "other_students_work",
        "answer_keys",
        "grade_books",
        "teacher_materials"
    ],
    typical_tasks=[
        "Completing assignments",
        "Studying for assessments",
        "Asking questions",
        "Seeking help understanding concepts",
        "Organizing study materials"
    ],
    support_needs=[
        "Clear explanations",
        "Study strategies",
        "Resource recommendations",
        "Organizational tools",
        "Learning encouragement"
    ],
    ai_can_help_with=[
        "Explain concepts",
        "Provide learning strategies",
        "Suggest resources",
        "Generate practice problems",
        "Offer study tips",
        "Clarify instructions"
    ],
    ai_cannot_help_with=[
        "Complete assignments for student",
        "Take tests for student",
        "Provide answers without learning",
        "Grade student work",
        "Access student records"
    ]
)

INSTRUCTIONAL_COACH_ROLE = RoleDefinition(
    role_type=EducationalRole.INSTRUCTIONAL_COACH,
    name="Instructional Coach",
    description="Supports teacher professional development and instructional improvement",
    can_access=[
        "professional_development_resources",
        "coaching_frameworks",
        "observation_tools",
        "data_analysis_support",
        "best_practice_libraries"
    ],
    cannot_access=[
        "teacher_evaluation_systems",
        "personnel_decisions",
        "confidential_teacher_data"
    ],
    typical_tasks=[
        "Coaching teachers",
        "Modeling instruction",
        "Facilitating professional learning",
        "Analyzing instructional data",
        "Providing feedback"
    ],
    support_needs=[
        "Coaching protocols",
        "Professional learning designs",
        "Data interpretation tools",
        "Resource curation",
        "Reflection prompts"
    ],
    ai_can_help_with=[
        "Design coaching cycles",
        "Suggest professional learning topics",
        "Curate resources",
        "Create reflection prompts",
        "Organize coaching documentation"
    ],
    ai_cannot_help_with=[
        "Evaluate teacher performance",
        "Make employment decisions",
        "Replace coaching relationship",
        "Provide confidential feedback"
    ]
)

SPECIAL_EDUCATOR_ROLE = RoleDefinition(
    role_type=EducationalRole.SPECIAL_EDUCATOR,
    name="Special Education Teacher",
    description="Supports students with special education needs",
    can_access=[
        "accommodation_strategies",
        "modification_tools",
        "assistive_technology_info",
        "differentiation_resources",
        "universal_design_guidelines"
    ],
    cannot_access=[
        "medical_diagnoses",
        "psychological_evaluations",
        "iep_legal_decisions"
    ],
    typical_tasks=[
        "Designing accommodations",
        "Modifying curriculum",
        "Collaborating with general educators",
        "Supporting IEP implementation",
        "Using specialized strategies"
    ],
    support_needs=[
        "Strategy recommendations",
        "Resource libraries",
        "Accommodation ideas",
        "Universal design examples",
        "Collaboration tools"
    ],
    ai_can_help_with=[
        "Suggest accommodation strategies",
        "Provide modification ideas",
        "Recommend assistive technology",
        "Generate differentiated materials",
        "Offer universal design examples"
    ],
    ai_cannot_help_with=[
        "Make IEP decisions",
        "Diagnose disabilities",
        "Determine eligibility",
        "Create legal documents",
        "Replace specialist evaluation"
    ]
)

ADMINISTRATOR_ROLE = RoleDefinition(
    role_type=EducationalRole.ADMINISTRATOR,
    name="School Administrator",
    description="Manages school operations and educational leadership",
    can_access=[
        "organizational_tools",
        "communication_systems",
        "planning_resources",
        "policy_information",
        "leadership_frameworks"
    ],
    cannot_access=[
        "individual_student_records",
        "teacher_evaluation_files",
        "confidential_hr_data"
    ],
    typical_tasks=[
        "Managing operations",
        "Supporting teachers",
        "Communicating with stakeholders",
        "Planning initiatives",
        "Overseeing compliance"
    ],
    support_needs=[
        "Organizational tools",
        "Communication templates",
        "Planning frameworks",
        "Data summaries",
        "Resource management"
    ],
    ai_can_help_with=[
        "Draft communications",
        "Organize schedules",
        "Create planning templates",
        "Suggest initiative frameworks",
        "Summarize information"
    ],
    ai_cannot_help_with=[
        "Make personnel decisions",
        "Access confidential data",
        "Implement policies independently",
        "Evaluate teachers",
        "Replace administrative judgment"
    ]
)


class RoleManager:
    """Manages role definitions and validates role-based access."""
    
    def __init__(self):
        self.roles: Dict[EducationalRole, RoleDefinition] = {
            EducationalRole.TEACHER: TEACHER_ROLE,
            EducationalRole.STUDENT: STUDENT_ROLE,
            EducationalRole.INSTRUCTIONAL_COACH: INSTRUCTIONAL_COACH_ROLE,
            EducationalRole.SPECIAL_EDUCATOR: SPECIAL_EDUCATOR_ROLE,
            EducationalRole.ADMINISTRATOR: ADMINISTRATOR_ROLE
        }
    
    def get_role(self, role_type: EducationalRole) -> Optional[RoleDefinition]:
        """Get role definition by type."""
        return self.roles.get(role_type)
    
    def validate_access(
        self,
        role_type: EducationalRole,
        requested_capability: str
    ) -> bool:
        """Validate if role can access a capability."""
        role = self.get_role(role_type)
        if not role:
            return False
        
        if requested_capability in role.cannot_access:
            return False
        
        return requested_capability in role.can_access
    
    def get_ai_capabilities_for_role(
        self,
        role_type: EducationalRole
    ) -> Dict[str, List[str]]:
        """Get AI capabilities and limitations for a role."""
        role = self.get_role(role_type)
        if not role:
            return {"can_help": [], "cannot_help": []}
        
        return {
            "can_help": role.ai_can_help_with,
            "cannot_help": role.ai_cannot_help_with
        }
    
    def get_role_summary(self, role_type: EducationalRole) -> str:
        """Get a summary of role capabilities and limitations."""
        role = self.get_role(role_type)
        if not role:
            return "Role not found"
        
        return f"""
{role.name}
{role.description}

Typical Tasks:
{chr(10).join(f'• {task}' for task in role.typical_tasks)}

AI Can Help With:
{chr(10).join(f'✓ {item}' for item in role.ai_can_help_with)}

AI Cannot Help With:
{chr(10).join(f'✗ {item}' for item in role.ai_cannot_help_with)}
"""


def get_role_manager() -> RoleManager:
    """Get role manager singleton."""
    return RoleManager()
