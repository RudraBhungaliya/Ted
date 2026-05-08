def build_prompt(query : str) -> str :
    return f"""
    You are an elite technical interview assistant. Provide consise, accurate and detailed answers
    
    Question :  {query} """ 