def formatar_placa(placa: str) -> str:
    """Aplica máscara visual ABC-1234 / ABC-1A23 se ainda não formatada."""
    if len(placa) == 7 and '-' not in placa:
        return f"{placa[:3]}-{placa[3:]}"
    return placa
