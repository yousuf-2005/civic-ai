import json
import logging
import re
from pathlib import Path
from typing import Dict, Any, Optional
from PIL import Image

from app.core.config import settings
from app.schemas.complaint import ImageValidationResponse, LetterGenerationRequest, LetterGenerationResponse

logger = logging.getLogger(__name__)

# Fallback categories
CIVIC_CATEGORIES = [
    "Potholes and Damaged Roads",
    "Overflowing Garbage and Illegal Dumping",
    "Broken Streetlights",
    "Water Leakage and Drainage",
    "Damaged Public Infrastructure",
    "Other Legitimate Public Service Problems",
]


class AIService:
    """Service for interacting with Gemini Vision and Text models with mock fallback."""

    def __init__(self):
        self._client = None
        self._init_client()

    def _init_client(self):
        if settings.GEMINI_API_KEY and not settings.AI_MOCK_MODE:
            try:
                from google import genai
                self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
                logger.info(f"Gemini client initialized with model '{settings.GEMINI_MODEL}'")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini client: {e}. Falling back to mock mode.")
                self._client = None
        else:
            self._client = None

    @property
    def is_live_ai_available(self) -> bool:
        return self._client is not None and bool(settings.GEMINI_API_KEY) and not settings.AI_MOCK_MODE

    async def validate_image(
        self,
        image_path: Path,
        filename: str,
        original_filename: Optional[str] = None,
    ) -> ImageValidationResponse:
        """
        Validates uploaded civic image using Gemini Vision (or mock fallback).
        Evaluates relevance, category, factual description, and rejection reason.
        """
        if not self.is_live_ai_available:
            return self._mock_image_validation(image_path, filename, original_filename=original_filename)

        try:
            from PIL import Image
            img = Image.open(image_path)

            prompt = (
                "You are an expert AI civic grievance triage assistant for municipal governments.\n"
                "Analyze this uploaded photograph submitted by a citizen.\n\n"
                "Determine the following:\n"
                "1. Is this a valid image of a civic/public grievance or infrastructure problem? (valid_image: true/false)\n"
                "2. Is it relevant to public infrastructure, sanitation, utilities, or road safety? (relevance: 'relevant', 'irrelevant', or 'uncertain')\n"
                "   - Mark 'irrelevant' if it is a personal portrait/selfie, meme, screenshot, indoor pet photo, landscape without issues, or unrelated item.\n"
                "3. Which civic category best matches the visible problem?\n"
                f"   Choose strictly from: {', '.join(CIVIC_CATEGORIES)}\n"
                "4. Provide a concise, factual description of visible evidence only. "
                "   DO NOT identify individuals, describe faces, or make assumptions about private persons.\n"
                "5. Assign a confidence score between 0.00 and 1.00.\n"
                "6. If invalid or irrelevant, specify rejection_reason. Otherwise null.\n"
                "7. Recommend the next step for the citizen.\n\n"
                "Respond ONLY with a valid JSON object matching this schema:\n"
                "{\n"
                '  "valid_image": true,\n'
                '  "relevance": "relevant",\n'
                '  "detected_category": "Potholes and Damaged Roads",\n'
                '  "description": "Visible deep asphalt crater and crumbling road surface.",\n'
                '  "confidence": 0.92,\n'
                '  "rejection_reason": null,\n'
                '  "recommended_next_step": "Proceed to generate formal complaint letter."\n'
                "}"
            )

            # Generate content using google-genai
            response = self._client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=[prompt, img],
            )

            text_output = response.text or ""
            # Extract JSON block
            json_match = re.search(r"\{.*\}", text_output, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(0))
                return ImageValidationResponse(
                    valid_image=bool(data.get("valid_image", True)),
                    relevance=data.get("relevance", "relevant"),
                    detected_category=data.get("detected_category", "Other Legitimate Public Service Problems"),
                    description=data.get("description", "Visible civic issue detected in photograph."),
                    confidence=float(data.get("confidence", 0.90)),
                    rejection_reason=data.get("rejection_reason"),
                    recommended_next_step=data.get("recommended_next_step", "Proceed to generate complaint letter."),
                    image_filename=filename,
                    is_mock=False,
                )
            else:
                logger.warning(f"Could not parse JSON from Gemini response: {text_output[:200]}")
                return self._mock_image_validation(image_path, filename, reason="Live AI returned unstructured response. Fallback to mock.")

        except Exception as e:
            logger.error(f"Gemini API image validation error: {e}", exc_info=True)
            # Safe user-facing fallback with transparent mock labeling
            return self._mock_image_validation(
                image_path,
                filename,
                reason=f"Gemini API unavailable ({type(e).__name__}). Using simulated analysis.",
            )

    async def generate_complaint_letter(self, req: LetterGenerationRequest) -> LetterGenerationResponse:
        """
        Generates a formal municipal complaint letter using Gemini (or mock fallback).
        """
        if not self.is_live_ai_available:
            return self._mock_letter_generation(req)

        try:
            prompt = (
                "You are an expert civic advocate and legal assistant helping a citizen draft a formal municipal grievance letter.\n"
                "Write a respectful, structured, and legally sound complaint letter based on the following verified information:\n\n"
                f"- Issue Title: {req.title}\n"
                f"- Category: {req.category}\n"
                f"- Description: {req.description}\n"
                f"- Location Address: {req.location_address or '[Address Not Specified]'}\n"
                f"- Coordinates: {f'Lat: {req.latitude}, Lng: {req.longitude}' if req.latitude and req.longitude else '[Coordinates Pending]'}\n"
                f"- Photographic Evidence Summary: {req.ai_image_description or '[Photo Evidence Attached]'}\n"
                f"- Citizen Name: {req.citizen_name or '[Citizen / Resident]'}\n"
                f"- Contact: {req.citizen_contact or '[Contact on Record]'}\n\n"
                "CRITICAL INSTRUCTIONS:\n"
                "1. DO NOT invent names of real government officials, fake department designations, or fictional statute numbers.\n"
                "2. Use formal placeholders like '[The Municipal Commissioner / Ward Officer]', '[Local Municipal Corporation]' where applicable.\n"
                "3. Include:\n"
                "   - Today's Date\n"
                "   - Formal Subject Line\n"
                "   - Salutation\n"
                "   - Clear description of the public hazard or grievance\n"
                "   - Exact location and impact on residents/commuters\n"
                "   - Specific requested action (inspection, repair, clearing)\n"
                "   - Formal closing\n\n"
                "Respond ONLY with a JSON object:\n"
                "{\n"
                '  "letter_subject": "Formal Grievance: Hazardous Potholes at Main Street",\n'
                '  "letter_body": "To,\\nThe Municipal Commissioner...\\n\\nSincerely,\\n[Citizen / Resident]"\n'
                "}"
            )

            response = self._client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=[prompt],
            )

            text_output = response.text or ""
            json_match = re.search(r"\{.*\}", text_output, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(0))
                return LetterGenerationResponse(
                    letter_subject=data.get("letter_subject", f"Formal Grievance: {req.title}"),
                    letter_body=data.get("letter_body", ""),
                    is_mock=False,
                )
            else:
                return self._mock_letter_generation(req)

        except Exception as e:
            logger.error(f"Gemini API letter generation error: {e}", exc_info=True)
            return self._mock_letter_generation(req)

    def _mock_image_validation(
        self,
        image_path: Path,
        filename: str,
        original_filename: Optional[str] = None,
        reason: Optional[str] = None,
    ) -> ImageValidationResponse:
        """
        Deterministic, realistic mock image analysis for offline development & tests.
        Clearly tagged as is_mock=True.
        """
        check_name = (original_filename or filename).lower()
        name_lower = check_name
        
        # Test hook for invalid / rejection images
        if "invalid" in check_name or "selfie" in check_name or "reject" in check_name:
            return ImageValidationResponse(
                valid_image=False,
                relevance="irrelevant",
                detected_category=None,
                description="The uploaded photograph appears to be a personal selfie, portrait, or unrelated subject with no visible civic infrastructure grievance.",
                confidence=0.91,
                rejection_reason="The uploaded image does not contain identifiable public infrastructure or civic issues.",
                recommended_next_step="Please upload a clear photograph of the actual public problem (road damage, garbage, streetlight, drainage).",
                image_filename=filename,
                is_mock=True,
            )

        # Infer category heuristics from name or default to Potholes
        if "garbage" in name_lower or "trash" in name_lower or "dump" in name_lower:
            cat = "Overflowing Garbage and Illegal Dumping"
            desc = "[MOCK MODE] Simulated detection: Accumulation of uncollected solid waste and municipal refuse obstructing public space."
        elif "light" in name_lower or "lamp" in name_lower:
            cat = "Broken Streetlights"
            desc = "[MOCK MODE] Simulated detection: Non-functional or physically damaged street lighting fixture presenting night visibility hazards."
        elif "water" in name_lower or "drain" in name_lower or "leak" in name_lower:
            cat = "Water Leakage and Drainage"
            desc = "[MOCK MODE] Simulated detection: Water leakage / stagnant overflow from damaged pipeline or clogged storm drain."
        elif "infra" in name_lower or "damage" in name_lower or "park" in name_lower:
            cat = "Damaged Public Infrastructure"
            desc = "[MOCK MODE] Simulated detection: Structural breakage in public amenity, pavement, or municipal railing."
        else:
            cat = "Potholes and Damaged Roads"
            desc = "[MOCK MODE] Simulated detection: Surface crater, asphalt cracking, and road deformation posing vehicular risk."

        notice = " [Simulated AI Result - Demo Mode]" if not reason else f" [{reason}]"

        return ImageValidationResponse(
            valid_image=True,
            relevance="relevant",
            detected_category=cat,
            description=f"{desc}{notice}",
            confidence=0.94,
            rejection_reason=None,
            recommended_next_step="Review the detected issue and proceed to draft the formal complaint letter.",
            image_filename=filename,
            is_mock=True,
        )

    def _mock_letter_generation(self, req: LetterGenerationRequest) -> LetterGenerationResponse:
        """
        High quality, structured mock letter generation for development and offline testing.
        """
        from datetime import date
        today_str = date.today().strftime("%B %d, %Y")
        citizen = req.citizen_name or "[Concerned Resident]"
        contact = req.citizen_contact or "[Contact Information on Record]"
        location = req.location_address or "[Exact Location Address]"
        coords = f"Coordinates: {req.latitude:.4f}, {req.longitude:.4f}" if req.latitude and req.longitude else ""

        body = (
            f"Date: {today_str}\n\n"
            f"To,\n"
            f"The Executive Engineer / Competent Municipal Authority,\n"
            f"Department of Public Works & Civic Maintenance,\n"
            f"[Local Municipal Corporation / Ward Office]\n\n"
            f"Subject: URGENT GRIEVANCE — {req.title.upper()}\n\n"
            f"Respected Sir/Madam,\n\n"
            f"I am writing this formal grievance to bring to your urgent attention a serious public problem falling under the category of '{req.category}'.\n\n"
            f"1. PROBLEM DETAILS:\n"
            f"{req.description}\n\n"
            f"2. LOCATION OF ISSUE:\n"
            f"Location: {location}\n"
            f"{coords}\n\n"
            f"3. FACTUAL EVIDENCE:\n"
            f"A photographic record of the affected site has been submitted and registered with this complaint. "
            f"Evidence summary: {req.ai_image_description or 'Photographic proof of public infrastructure defect is attached.'}\n\n"
            f"4. REQUESTED ACTION:\n"
            f"In the interest of public safety, sanitation, and municipal standards, I earnestly request your department to conduct an on-site inspection and initiate necessary corrective repair or maintenance work at the earliest.\n\n"
            f"Kindly provide a status update on this grievance via our registered reference.\n\n"
            f"Yours sincerely,\n"
            f"{citizen}\n"
            f"{contact}\n\n"
            f"--------------------------------------------------\n"
            f"[Note: This draft was formatted via Civic AI Assistive Drafting. Citizen may review and edit.]"
        )

        return LetterGenerationResponse(
            letter_subject=f"Formal Grievance: {req.title}",
            letter_body=body,
            is_mock=True,
        )


ai_service = AIService()
