"""
Healthcare Non-Clinical Fork - Intake Simulation

Simulates patient intake processes (NON-CLINICAL administrative only).
"""

from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class IntakeType(Enum):
    """Types of patient intake (administrative only)."""
    NEW_PATIENT = "new_patient"
    RETURN_VISIT = "return_visit"
    FOLLOW_UP = "follow_up"
    CONSULTATION = "consultation"


class AppointmentReason(Enum):
    """General appointment reasons (non-clinical)."""
    GENERAL = "general"
    FOLLOW_UP = "follow_up"
    CONSULTATION = "consultation"
    ADMINISTRATIVE = "administrative"


@dataclass
class IntakeSession:
    """Simulates a non-clinical intake session."""
    session_id: str
    intake_type: IntakeType
    timestamp: datetime = field(default_factory=datetime.now)
    
    # Administrative data only (NO PHI)
    appointment_reason: AppointmentReason = AppointmentReason.GENERAL
    department: str = ""
    provider_type: str = ""
    
    # Checklist items
    documentation_completed: List[str] = field(default_factory=list)
    information_provided: List[str] = field(default_factory=list)
    
    def add_documentation_completed(self, doc_type: str):
        """Record that documentation was completed."""
        if doc_type not in self.documentation_completed:
            self.documentation_completed.append(doc_type)
    
    def add_information_provided(self, info_type: str):
        """Record that information was provided to patient."""
        if info_type not in self.information_provided:
            self.information_provided.append(info_type)


class IntakeSimulator:
    """Simulates non-clinical intake processes."""
    
    def __init__(self):
        self.sessions: Dict[str, IntakeSession] = {}
    
    def create_session(
        self,
        session_id: str,
        intake_type: IntakeType,
        department: str
    ) -> IntakeSession:
        """Create a new intake session."""
        session = IntakeSession(
            session_id=session_id,
            intake_type=intake_type,
            department=department
        )
        self.sessions[session_id] = session
        return session
    
    def get_intake_checklist(self, intake_type: IntakeType) -> Dict:
        """Get administrative intake checklist."""
        
        base_checklist = [
            "Verify appointment time",
            "Confirm department and provider",
            "Explain facility layout",
            "Provide parking validation",
            "Explain check-in process"
        ]
        
        if intake_type == IntakeType.NEW_PATIENT:
            base_checklist.extend([
                "Patient registration forms",
                "Insurance information collection",
                "Emergency contact information",
                "Facility orientation",
                "Patient portal setup"
            ])
        
        return {
            'intake_type': intake_type.value,
            'checklist': base_checklist,
            'note': 'This is administrative checklist only - clinical intake performed by healthcare staff'
        }
    
    def provide_appointment_preparation(
        self,
        appointment_type: str
    ) -> Dict:
        """Provide general appointment preparation information."""
        
        return {
            'appointment_type': appointment_type,
            'general_preparation': [
                'Arrive 15 minutes early for check-in',
                'Bring insurance card and photo ID',
                'Bring list of current medications (if applicable)',
                'Bring relevant previous medical records (if from another facility)',
                'Note questions you want to ask provider'
            ],
            'what_to_expect': [
                'Check-in at registration desk',
                'Verification of information',
                'Brief wait in waiting area',
                'Called back for appointment'
            ],
            'disclaimer': (
                'This is general information. Your healthcare provider may have '
                'specific preparation instructions. Follow provider instructions.'
            )
        }
    
    def get_facility_information(self) -> Dict:
        """Provide general facility information."""
        
        return {
            'parking': {
                'main_parking': 'Available in front of building',
                'accessible_parking': 'Reserved spots near main entrance',
                'validation': 'Available at registration desk'
            },
            'entrances': {
                'main_entrance': 'Front entrance - accessible',
                'emergency_entrance': 'Clearly marked for emergencies only'
            },
            'amenities': {
                'waiting_area': 'Comfortable seating, WiFi available',
                'restrooms': 'Located near waiting area',
                'cafeteria': 'Open weekdays 7am-7pm',
                'gift_shop': 'Open weekdays 9am-5pm'
            },
            'accessibility': {
                'wheelchair_access': 'All areas accessible',
                'elevators': 'Available for multi-floor navigation',
                'assistance': 'Staff available to assist with mobility'
            }
        }
    
    def get_insurance_information_general(self) -> Dict:
        """Provide general insurance information (not personalized)."""
        
        return {
            'what_to_bring': [
                'Insurance card (front and back)',
                'Photo identification',
                'Referral if required by plan'
            ],
            'common_questions': {
                'copay': 'Copay amount depends on your specific insurance plan',
                'coverage': 'Coverage verification done at check-in',
                'referral': 'Check with insurance if referral needed'
            },
            'billing': {
                'when_charged': 'Claims submitted to insurance after visit',
                'statements': 'Mailed if patient responsibility after insurance',
                'questions': 'Contact billing department for billing questions'
            },
            'note': (
                'This is general information. Specific coverage questions '
                'should be directed to your insurance company.'
            )
        }
    
    def get_patient_portal_information(self) -> Dict:
        """Provide patient portal information."""
        
        return {
            'benefits': [
                'View upcoming appointments',
                'Receive test results (when released by provider)',
                'Message your healthcare team',
                'Request prescription refills',
                'View visit summaries',
                'Access billing statements'
            ],
            'setup': [
                'Request access code at registration',
                'Visit portal website',
                'Create account with access code',
                'Set up security questions',
                'Enable two-factor authentication'
            ],
            'security': [
                'Never share login credentials',
                'Use strong password',
                'Enable notifications for security',
                'Log out on shared devices'
            ],
            'note': (
                'Patient portal provides access to YOUR medical information. '
                'Clinical questions should be directed to healthcare providers.'
            )
        }


def create_sample_intake_scenarios() -> List[Dict]:
    """Create sample intake scenarios for testing."""
    
    return [
        {
            'name': 'New Patient Primary Care',
            'intake_type': IntakeType.NEW_PATIENT,
            'department': 'Primary Care',
            'key_tasks': [
                'Complete registration',
                'Verify insurance',
                'Provide facility orientation',
                'Set up patient portal'
            ]
        },
        {
            'name': 'Return Visit Specialist',
            'intake_type': IntakeType.RETURN_VISIT,
            'department': 'Cardiology',
            'key_tasks': [
                'Confirm appointment',
                'Verify contact information',
                'Check insurance updates',
                'Provide parking information'
            ]
        },
        {
            'name': 'Follow-Up Administrative',
            'intake_type': IntakeType.FOLLOW_UP,
            'department': 'General Surgery',
            'key_tasks': [
                'Confirm follow-up reason',
                'Verify provider',
                'Explain check-in process',
                'Answer administrative questions'
            ]
        }
    ]
