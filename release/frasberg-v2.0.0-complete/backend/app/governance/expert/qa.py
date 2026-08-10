"""
Expert Witness Q&A System

Handles questions and answers for expert witness mode, with scope enforcement
and disclaimer generation for out-of-scope questions.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum
from .scope import ExpertScope, ScopeDefinition


class QuestionType(Enum):
    """Types of questions"""
    TECHNICAL = "technical"
    FACTUAL = "factual"
    OPINION = "opinion"
    LEGAL = "legal"
    HYPOTHETICAL = "hypothetical"
    CASE_SPECIFIC = "case_specific"


@dataclass
class Question:
    """Expert witness question"""
    question_id: str
    question_text: str
    question_type: QuestionType
    context: Dict[str, Any]
    

@dataclass
class Answer:
    """Expert witness answer"""
    question_id: str
    answer_text: str
    in_scope: bool
    confidence: str  # high, medium, low
    caveats: List[str]
    references: List[str]
    declined_reason: Optional[str] = None


class ExpertQA:
    """
    Expert witness Q&A system.
    
    Manages questions and answers with strict scope enforcement.
    Automatically detects out-of-scope questions and provides
    appropriate disclaimers.
    """
    
    def __init__(
        self,
        expert_name: str,
        scope: ExpertScope,
    ):
        """
        Initialize expert Q&A system.
        
        Args:
            expert_name: Name of expert witness
            scope: Expert's scope definition
        """
        self.expert_name = expert_name
        self.scope = scope
        self._qa_history: List[tuple[Question, Answer]] = []
    
    def answer_question(
        self,
        question_text: str,
        question_type: QuestionType,
        context: Optional[Dict[str, Any]] = None,
    ) -> Answer:
        """
        Answer a question with scope checking.
        
        Args:
            question_text: The question being asked
            question_type: Type of question
            context: Additional context
            
        Returns:
            Answer with scope compliance
        """
        import uuid
        
        question = Question(
            question_id=str(uuid.uuid4()),
            question_text=question_text,
            question_type=question_type,
            context=context or {},
        )
        
        # Check if question is in scope
        in_scope = self._is_in_scope(question)
        
        if not in_scope:
            answer = self._generate_out_of_scope_answer(question)
        else:
            answer = self._generate_answer(question)
        
        # Record Q&A
        self._qa_history.append((question, answer))
        
        return answer
    
    def get_qa_history(self) -> List[Dict[str, Any]]:
        """
        Get Q&A history.
        
        Returns:
            List of question-answer pairs
        """
        history = []
        for question, answer in self._qa_history:
            history.append({
                "question": {
                    "id": question.question_id,
                    "text": question.question_text,
                    "type": question.question_type.value,
                },
                "answer": {
                    "text": answer.answer_text,
                    "in_scope": answer.in_scope,
                    "confidence": answer.confidence,
                    "caveats": answer.caveats,
                },
            })
        return history
    
    def generate_deposition_transcript(self) -> str:
        """
        Generate formatted deposition transcript.
        
        Returns:
            Formatted transcript text
        """
        from datetime import datetime, timezone
        
        transcript = f"""
{'='*80}
EXPERT WITNESS DEPOSITION TRANSCRIPT
{'='*80}

Expert: {self.expert_name}
Date: {datetime.now(timezone.utc).strftime('%Y-%m-%d')}
Total Questions: {len(self._qa_history)}

{'='*80}

"""
        
        for idx, (question, answer) in enumerate(self._qa_history, 1):
            transcript += f"""
Q{idx}: {question.question_text}

A{idx}: {answer.answer_text}
"""
            
            if answer.caveats:
                transcript += "\n[Caveats: " + "; ".join(answer.caveats) + "]\n"
            
            if not answer.in_scope:
                transcript += "\n[Note: Question outside expert's scope]\n"
            
            transcript += "\n" + "-"*80 + "\n"
        
        return transcript
    
    def _is_in_scope(self, question: Question) -> bool:
        """Check if question is within expert's scope"""
        # Legal questions always out of scope
        if question.question_type == QuestionType.LEGAL:
            return False
        
        # Opinion questions require careful evaluation
        if question.question_type == QuestionType.OPINION:
            # Only allow opinions on technical matters within scope
            return self._is_technical_opinion(question)
        
        # Check against scope definition
        return self.scope.is_in_scope(question.question_text)
    
    def _is_technical_opinion(self, question: Question) -> bool:
        """Determine if opinion question is about technical matters"""
        technical_keywords = [
            "system", "hash", "algorithm", "timestamp", "encryption",
            "audit", "log", "chain", "verification", "integrity",
        ]
        
        text_lower = question.question_text.lower()
        return any(keyword in text_lower for keyword in technical_keywords)
    
    def _generate_answer(self, question: Question) -> Answer:
        """Generate answer for in-scope question"""
        # In production, this would integrate with the explainer and knowledge base
        # For now, return a template answer
        
        answer_text = (
            f"Regarding your question about {question.question_text[:50]}..., "
            "based on my knowledge of the Frasberg Governance System, "
            "[detailed technical answer would be provided here]."
        )
        
        caveats = [
            "Answer based on my understanding of the system's design and implementation",
            "Actual behavior may vary based on configuration and deployment",
        ]
        
        if question.question_type == QuestionType.HYPOTHETICAL:
            caveats.append("This is a hypothetical scenario and may not reflect actual circumstances")
        
        return Answer(
            question_id=question.question_id,
            answer_text=answer_text,
            in_scope=True,
            confidence="high",
            caveats=caveats,
            references=["Frasberg Technical Documentation"],
        )
    
    def _generate_out_of_scope_answer(self, question: Question) -> Answer:
        """Generate appropriate response for out-of-scope question"""
        
        if question.question_type == QuestionType.LEGAL:
            reason = "legal interpretation or opinion"
            answer_text = (
                "I must respectfully decline to answer this question as it calls for "
                "a legal interpretation or opinion. My expertise is limited to the "
                "technical operation of the Frasberg Governance System. Questions "
                "about legal matters should be directed to a qualified attorney."
            )
        
        elif question.question_type == QuestionType.CASE_SPECIFIC:
            reason = "case-specific facts outside my knowledge"
            answer_text = (
                "I cannot answer this question as it pertains to specific facts of "
                "this case that are outside my area of expertise. I can only testify "
                "to the technical design and operation of the Frasberg system in "
                "general, not to specific facts or circumstances of particular cases."
            )
        
        elif not self.scope.is_in_scope(question.question_text):
            reason = "outside stated scope of expertise"
            answer_text = (
                f"This question is outside the scope of my expertise. I am qualified "
                f"to testify regarding: {', '.join(self.scope.scope_areas)}. "
                "The question you've asked falls outside these areas."
            )
        
        else:
            reason = "insufficient information to provide reliable answer"
            answer_text = (
                "I do not have sufficient information or expertise to provide a "
                "reliable answer to this question. It would be inappropriate for me "
                "to speculate or offer an opinion outside my area of expertise."
            )
        
        return Answer(
            question_id=question.question_id,
            answer_text=answer_text,
            in_scope=False,
            confidence="n/a",
            caveats=[f"Question declined: {reason}"],
            references=[],
            declined_reason=reason,
        )
    
    def prepare_testimony(
        self,
        topics: List[str],
    ) -> Dict[str, Any]:
        """
        Prepare expert testimony on specific topics.
        
        Args:
            topics: Topics to prepare testimony for
            
        Returns:
            Prepared testimony materials
        """
        testimony = {
            "expert": self.expert_name,
            "scope": self.scope.to_dict(),
            "topics": topics,
            "prepared_statements": {},
            "anticipated_questions": [],
        }
        
        # Generate prepared statements for each topic
        for topic in topics:
            if self.scope.is_in_scope(topic):
                testimony["prepared_statements"][topic] = (
                    f"Prepared statement regarding {topic}..."
                )
                
                # Add anticipated questions
                testimony["anticipated_questions"].extend(
                    self._generate_anticipated_questions(topic)
                )
        
        return testimony
    
    def _generate_anticipated_questions(self, topic: str) -> List[str]:
        """Generate anticipated questions for a topic"""
        # In production, this would use a knowledge base
        return [
            f"Can you explain {topic} in layperson's terms?",
            f"How does {topic} ensure reliability?",
            f"What are the limitations of {topic}?",
        ]
    
    def validate_scope_compliance(self) -> Dict[str, Any]:
        """
        Validate that all answers stayed within scope.
        
        Returns:
            Compliance report
        """
        total_questions = len(self._qa_history)
        in_scope = sum(1 for _, a in self._qa_history if a.in_scope)
        out_of_scope = total_questions - in_scope
        
        # Check for any problematic answers
        issues = []
        for question, answer in self._qa_history:
            if not answer.in_scope and answer.declined_reason is None:
                issues.append({
                    "question_id": question.question_id,
                    "issue": "Out of scope answer without proper disclaimer",
                })
        
        return {
            "compliant": len(issues) == 0,
            "total_questions": total_questions,
            "in_scope_answers": in_scope,
            "out_of_scope_declined": out_of_scope,
            "issues": issues,
        }
