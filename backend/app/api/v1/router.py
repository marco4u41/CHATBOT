from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.api.schemas.chat import ChatRequest, ChatStreamChunk
from app.api.schemas.conversation import ConversationResponse, MessageResponse
from app.api.schemas.vehicle import (
    DiagnosisRequest,
    LLMResponse,
    RecommendationRequest,
    VehicleComparisonRequest,
)
from app.dependencies import (
    get_chat_use_case,
    get_conversation_use_case,
    get_diagnosis_use_case,
    get_recommendation_use_case,
    get_vehicle_comparison_use_case,
)
from app.domain.exceptions import ChatbotError
from app.domain.models.vehicle import Vehicle
from app.use_cases.chat import ChatUseCase
from app.use_cases.conversations import ConversationUseCase
from app.use_cases.diagnosis import DiagnosisUseCase
from app.use_cases.recommendation import RecommendationUseCase
from app.use_cases.vehicle_comparison import VehicleComparisonUseCase

router = APIRouter()


@router.post("/chat")
async def chat(
    request: ChatRequest,
    use_case: ChatUseCase = Depends(get_chat_use_case),
):
    async def event_generator():
        try:
            async for chunk, done, conv_id in use_case.stream_response(
                request.message,
                request.conversation_id,
                budget=request.budget,
                terrain=request.terrain,
                engine_type=request.engine_type,
            ):
                data = ChatStreamChunk(
                    content=chunk,
                    done=done,
                    conversation_id=conv_id,
                )
                yield f"data: {data.model_dump_json()}\n\n"
        except ChatbotError as exc:
            import json
            error_data = {"error": str(exc), "done": True}
            yield f"data: {json.dumps(error_data)}\n\n"
        except Exception as exc:
            import json
            import traceback
            traceback.print_exc()
            error_data = {"error": f"Error interno del servidor: {exc}", "done": True}
            yield f"data: {json.dumps(error_data)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    use_case: ConversationUseCase = Depends(get_conversation_use_case),
):
    conversations = await use_case.list_all()
    return [
        ConversationResponse(
            id=c.id,
            title=c.title,
            created_at=c.created_at,
            updated_at=c.updated_at,
            message_count=c.message_count,
        )
        for c in conversations
    ]


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
async def get_conversation_messages(
    conversation_id: str,
    use_case: ConversationUseCase = Depends(get_conversation_use_case),
):
    messages = await use_case.get_messages(conversation_id)
    return [
        MessageResponse(
            id=m.id,
            content=m.content,
            role=m.role.value,
            conversation_id=m.conversation_id,
            created_at=m.created_at,
        )
        for m in messages
    ]


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    use_case: ConversationUseCase = Depends(get_conversation_use_case),
):
    await use_case.delete(conversation_id)
    return {"success": True}


@router.post("/vehicles/compare", response_model=LLMResponse)
async def compare_vehicles(
    request: VehicleComparisonRequest,
    use_case: VehicleComparisonUseCase = Depends(get_vehicle_comparison_use_case),
):
    vehicles = [
        Vehicle(
            brand=v.brand,
            model=v.model,
            year=v.year,
            engine=v.engine,
            transmission=v.transmission,
            fuel_type=v.fuel_type,
            mileage_km=v.mileage_km,
            price_usd=v.price_usd,
        )
        for v in request.vehicles
    ]
    result = await use_case.compare(
        vehicles, request.focus, profile_id=request.profile_id,
    )
    return LLMResponse(response=result)


@router.post("/vehicles/diagnose", response_model=LLMResponse)
async def diagnose_vehicle(
    request: DiagnosisRequest,
    use_case: DiagnosisUseCase = Depends(get_diagnosis_use_case),
):
    vehicle = Vehicle(
        brand=request.vehicle.brand,
        model=request.vehicle.model,
        year=request.vehicle.year,
        engine=request.vehicle.engine,
        transmission=request.vehicle.transmission,
        fuel_type=request.vehicle.fuel_type,
        mileage_km=request.vehicle.mileage_km,
        price_usd=request.vehicle.price_usd,
    )
    result = await use_case.diagnose(
        vehicle, request.symptoms, request.category,
        profile_id=request.profile_id,
    )
    return LLMResponse(response=result)


@router.post("/vehicles/recommend", response_model=LLMResponse)
async def get_recommendation(
    request: RecommendationRequest,
    use_case: RecommendationUseCase = Depends(get_recommendation_use_case),
):
    result = await use_case.recommend(
        request.budget_usd, request.usage, request.priorities,
        profile_id=request.profile_id,
    )
    return LLMResponse(response=result)
