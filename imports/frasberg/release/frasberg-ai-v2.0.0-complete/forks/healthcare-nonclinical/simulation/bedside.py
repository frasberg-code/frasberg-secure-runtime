"""
Healthcare Non-Clinical Fork - Bedside Support Simulation

Simulates NON-CLINICAL bedside support (comfort, communication, not medical care).
"""

from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class SupportType(Enum):
    """Types of non-clinical bedside support."""
    COMFORT = "comfort"
    COMMUNICATION = "communication"
    ENTERTAINMENT = "entertainment"
    FAMILY_CONNECTION = "family_connection"
    GENERAL_ASSISTANCE = "general_assistance"


@dataclass
class BedsideSupportSession:
    """Represents a non-clinical bedside support session."""
    session_id: str
    support_type: SupportType
    timestamp: datetime = field(default_factory=datetime.now)
    
    activities: List[str] = field(default_factory=list)
    
    def add_activity(self, activity: str):
        """Log a support activity."""
        self.activities.append({
            'activity': activity,
            'timestamp': datetime.now()
        })


class BedsideSupportSimulator:
    """Simulates non-clinical bedside support interactions."""
    
    CRITICAL_NOTICE = (
        "⚠️  NON-CLINICAL SUPPORT ONLY ⚠️\n"
        "This system provides comfort and communication support.\n"
        "For clinical needs: Use nurse call button\n"
        "For emergencies: Press emergency button or call 911"
    )
    
    def __init__(self):
        self.sessions: Dict[str, BedsideSupportSession] = {}
    
    def create_session(
        self,
        session_id: str,
        support_type: SupportType
    ) -> BedsideSupportSession:
        """Create a new bedside support session."""
        session = BedsideSupportSession(
            session_id=session_id,
            support_type=support_type
        )
        self.sessions[session_id] = session
        return session
    
    def get_comfort_measures(self) -> Dict:
        """Provide general non-clinical comfort information."""
        
        return {
            'notice': self.CRITICAL_NOTICE,
            'general_comfort': {
                'positioning': [
                    'Pillows available for positioning support',
                    'Request assistance from nursing staff for repositioning',
                    'Use bed controls as instructed by staff'
                ],
                'environment': [
                    'Adjust room temperature with thermostat',
                    'Control lighting with switches',
                    'Request extra blankets from staff',
                    'Ask for window blinds adjustment'
                ],
                'personal_items': [
                    'Keep call button within reach',
                    'Arrange personal items nearby',
                    'Use bedside table for convenience',
                    'Request assistance organizing items'
                ]
            },
            'when_to_call_nurse': [
                'Pain or discomfort',
                'Need medication',
                'Bathroom assistance',
                'Position change assistance',
                'Any clinical concern'
            ],
            'critical_note': 'For pain management or clinical comfort needs, contact nursing staff immediately.'
        }
    
    def get_communication_support(self) -> Dict:
        """Provide communication assistance information."""
        
        return {
            'notice': self.CRITICAL_NOTICE,
            'communicating_with_care_team': {
                'nurse_call_button': 'Press to contact nursing staff',
                'provider_rounds': 'Ask questions during provider visits',
                'patient_portal': 'Message care team through portal',
                'advocacy': 'Ask staff about patient advocate if needed'
            },
            'family_communication': {
                'visiting_hours': 'Check with nursing staff for current policy',
                'phone_calls': 'Phone available for contacting family',
                'video_calls': 'Request assistance setting up video calls',
                'updates': 'Authorize family to receive updates from providers'
            },
            'communication_aids': {
                'language_services': 'Professional interpreters available',
                'hearing_assistance': 'Request assistive devices',
                'vision_assistance': 'Large print materials available',
                'writing_materials': 'Request paper and pen if helpful'
            }
        }
    
    def get_entertainment_options(self) -> Dict:
        """Provide entertainment and activity information."""
        
        return {
            'notice': 'Activities for comfort and passing time during stay',
            'in_room_options': {
                'television': 'Remote control instructions available',
                'radio': 'Channel guide available',
                'internet': 'WiFi access information at nurses station',
                'reading': 'Hospital library cart visits periodically'
            },
            'personal_devices': {
                'phones': 'Charging stations available',
                'tablets': 'WiFi network information available',
                'laptops': 'Secure on bedside table when not in use',
                'headphones': 'Recommended for personal listening'
            },
            'quiet_time': {
                'rest_periods': 'Quiet hours typically 10pm-6am',
                'do_not_disturb': 'Discuss preferences with nursing staff',
                'relaxation': 'Quiet activities encouraged'
            },
            'note': 'Balance activity with rest. Follow any activity restrictions from your care team.'
        }
    
    def get_daily_living_support(self) -> Dict:
        """Provide information about daily living activities support."""
        
        return {
            'notice': self.CRITICAL_NOTICE,
            'hygiene_support': {
                'bathing': 'Nursing staff assists with bathing',
                'oral_care': 'Supplies available, ask staff for assistance',
                'grooming': 'Personal care items available',
                'clothing': 'Request assistance changing clothes'
            },
            'mobility_support': {
                'getting_up': 'Always call for assistance before getting up',
                'walking': 'Staff assistance for walking if approved',
                'bathroom': 'Use call button for bathroom assistance',
                'fall_prevention': 'Keep bed rails up as instructed, call for help'
            },
            'meals': {
                'meal_times': 'Standard meal schedule posted',
                'preferences': 'Discuss dietary preferences with staff',
                'assistance': 'Request help with meals if needed',
                'snacks': 'Ask staff about available snacks'
            },
            'critical_note': (
                'ALWAYS call for assistance with mobility. '
                'Follow any restrictions from your care team.'
            )
        }
    
    def get_patient_advocacy_info(self) -> Dict:
        """Provide information about patient advocacy (non-clinical)."""
        
        return {
            'what_is_advocacy': (
                'Patient advocates help with non-clinical concerns, '
                'rights, and navigating the healthcare system.'
            ),
            'when_to_contact': [
                'Questions about patient rights',
                'Concerns about care coordination',
                'Communication challenges',
                'Billing or insurance questions',
                'Facility policy questions',
                'Discharge planning assistance'
            ],
            'how_to_contact': {
                'through_staff': 'Ask nursing staff for patient advocate',
                'phone': 'Patient advocacy office phone available at nurses station',
                'in_person': 'Advocate can visit if requested'
            },
            'what_they_can_help_with': [
                'Understanding your rights',
                'Coordinating communication',
                'Resolving non-clinical concerns',
                'Connecting with resources',
                'Explaining processes and policies'
            ],
            'note': 'Patient advocates address non-clinical concerns. Clinical care questions go to care team.'
        }


def create_sample_bedside_scenarios() -> List[Dict]:
    """Create sample bedside support scenarios for testing."""
    
    return [
        {
            'name': 'Comfort Support Request',
            'support_type': SupportType.COMFORT,
            'scenario': 'Patient requesting information about comfort positioning',
            'appropriate_response': 'Provide general comfort information, direct to nursing staff for positioning assistance'
        },
        {
            'name': 'Family Communication',
            'support_type': SupportType.FAMILY_CONNECTION,
            'scenario': 'Patient wants to video call family',
            'appropriate_response': 'Explain how to set up video call, offer to get device if available'
        },
        {
            'name': 'Entertainment Request',
            'support_type': SupportType.ENTERTAINMENT,
            'scenario': 'Patient bored and wants activity suggestions',
            'appropriate_response': 'Provide entertainment options, check for activity restrictions from care team'
        },
        {
            'name': 'General Assistance',
            'support_type': SupportType.GENERAL_ASSISTANCE,
            'scenario': 'Patient needs help organizing personal items',
            'appropriate_response': 'Offer to help arrange items within reach, ensure call button accessible'
        }
    ]
