"""Conteúdo do desafio: hábitos fixos, pools de desafios, surpresas e conquistas.

Tudo aqui é dado "de catálogo" (não muda em runtime), consumido pela lógica de
pontuação em ``scoring.py``. As categorias seguem a especificação do desafio,
com o acréscimo da categoria "Relação" (casal).
"""

# --- Hábitos fixos ---------------------------------------------------------
# Conjunto padrão (5 hábitos = 50 pontos), alinhado ao teto de 120 pts/dia.
DEFAULT_HABITS = [
    {"key": "agua", "label": "Beber 2,5L de água", "emoji": "💧", "category": "Saúde"},
    {"key": "sono", "label": "Dormir no mínimo 7h30", "emoji": "😴", "category": "Saúde"},
    {"key": "refeicoes", "label": "Não pular refeições", "emoji": "🍽️", "category": "Saúde"},
    {"key": "leitura", "label": "Ler 10 páginas (ou 15 min)", "emoji": "📖", "category": "Mental"},
    {"key": "devocional", "label": "Fazer o devocional", "emoji": "🙏", "category": "Espiritual"},
]

# Menu completo de hábitos (o casal pode adicionar estes nas configurações).
HABITS_MENU = DEFAULT_HABITS + [
    {"key": "proteina", "label": "Bater a meta de proteína", "emoji": "🥩", "category": "Saúde"},
    {"key": "passos", "label": "Caminhar 8.000 passos", "emoji": "🚶", "category": "Corpo"},
    {"key": "alongar", "label": "Alongar por 10 minutos", "emoji": "🤸", "category": "Corpo"},
    {"key": "orar", "label": "Orar", "emoji": "🕊️", "category": "Espiritual"},
    {"key": "cama", "label": "Arrumar a cama", "emoji": "🛏️", "category": "Organização"},
    {"key": "tarefas", "label": "Não deixar tarefas acumuladas", "emoji": "✅", "category": "Organização"},
]

# --- Desafios variáveis por categoria -------------------------------------
CHALLENGE_POOLS = {
    "Física": [
        "Fazer um exercício que você normalmente evita.",
        "Correr 5 km.",
        "Fazer 100 agachamentos.",
        "Fazer 60 flexões (pode dividir ao longo do dia).",
        "Caminhar 12 mil passos.",
        "Subir escadas em vez de usar o elevador.",
        "Fazer um treino de mobilidade.",
        "Completar um treino sem pausas longas.",
        "Bater seu recorde na prancha.",
        "Fazer um HIIT.",
        "Treinar ao ar livre.",
        "Fazer um treino em casal.",
        "Experimentar um esporte diferente.",
        "Alongar por 30 minutos.",
        "Pedalar por 40 minutos.",
    ],
    "Mental": [
        "Ficar 2 horas sem redes sociais.",
        "Meditar por 15 minutos.",
        "Escrever 10 coisas pelas quais você é grato.",
        "Escrever suas metas para os próximos 6 meses.",
        "Fazer uma atividade sem música.",
        "Aprender algo novo por 30 minutos.",
        "Resolver um quebra-cabeça ou sudoku.",
        "Escrever em um diário.",
        "Assistir a uma palestra educativa.",
        "Organizar completamente um ambiente.",
        "Passar o dia sem reclamar (registre se conseguiu).",
        "Fazer uma lista de prioridades para a semana.",
        "Refletir sobre um erro e escrever o aprendizado.",
    ],
    "Social": [
        "Elogiar sinceramente três pessoas.",
        "Conversar com alguém com quem você não fala há muito tempo.",
        "Ajudar alguém sem esperar retorno.",
        "Fazer uma ligação para um familiar.",
        "Passar uma refeição inteira sem o celular.",
        "Ter uma conversa de pelo menos 30 minutos com alguém importante.",
        "Conhecer uma pessoa nova.",
        "Escrever uma carta ou mensagem de agradecimento.",
        "Fazer um ato de gentileza anônimo.",
        "Convidar alguém para caminhar ou treinar junto.",
        "Fazer uma refeição em família sem distrações.",
        "Perguntar genuinamente como alguém está e ouvir com atenção.",
    ],
    "Relação": [
        "Planejar e ter um encontro (date) com o(a) parceiro(a), sem celular.",
        "Escrever um bilhete ou carta para o(a) parceiro(a).",
        "Cozinhar uma refeição juntos.",
        "Treinar ou caminhar em casal.",
        "Relembrarem juntos uma memória boa de vocês.",
        "Fazer algo que o(a) parceiro(a) ama (mesmo que você não curta tanto).",
        "Dar um elogio sincero sobre algo além da aparência.",
        "Ter uma conversa de 30 min sobre sonhos e planos do casal.",
        "Definir juntos uma meta em comum para o mês.",
        "Perguntar 'como posso te apoiar essa semana?' e agir nisso.",
        "Resolver um desentendimento com calma, sem elevar a voz.",
        "Orar ou agradecer juntos pelo relacionamento.",
        "Fazer uma tarefa do outro sem ele(a) pedir.",
        "Desligar as telas 1h antes de dormir e conversar.",
    ],
    "Espiritual": [
        "Ler um capítulo da Bíblia.",
        "Decorar um versículo.",
        "Orar por alguém específico.",
        "Ouvir um louvor refletindo sobre a letra.",
        "Escrever um testemunho.",
        "Fazer um momento de silêncio e reflexão.",
        "Anotar três motivos de gratidão a Deus.",
        "Compartilhar uma palavra de incentivo baseada na Bíblia.",
    ],
}

# Ordem de rotação das categorias do desafio do dia.
CATEGORY_ORDER = ["Física", "Mental", "Social", "Relação", "Espiritual"]

CATEGORY_EMOJI = {
    "Física": "💪",
    "Mental": "🧠",
    "Social": "🤝",
    "Relação": "💞",
    "Espiritual": "🙏",
}

# --- Desafios surpresa -----------------------------------------------------
SURPRISE_POOL = [
    "Tomar um banho gelado.",
    "Acordar antes das 6h.",
    "Caminhar 15 mil passos.",
    "Fazer 200 abdominais (pode dividir).",
    "Passar o dia sem açúcar.",
    "Passar o dia sem refrigerante.",
    "Ficar sem comida ultraprocessada hoje.",
    "Organizar completamente o quarto.",
    "Fazer uma boa ação sem contar para ninguém.",
    "Assistir a um documentário.",
    "Escrever uma carta para o 'eu do futuro'.",
    "Passar o dia inteiro sem reclamar.",
    "Doar roupas ou alimentos.",
]

# --- Conquistas ------------------------------------------------------------
# Cada conquista define uma métrica e um alvo; a checagem fica em scoring.py.
ACHIEVEMENTS = [
    {"key": "primeiros_7", "name": "Primeiros 7 dias", "emoji": "🥉",
     "desc": "Conclua 7 dias do desafio.", "metric": "completed_days", "target": 7},
    {"key": "consecutivos_10", "name": "10 dias consecutivos", "emoji": "🔥",
     "desc": "Alcance uma sequência de 10 dias.", "metric": "best_streak", "target": 10},
    {"key": "completos_30", "name": "30 dias completos", "emoji": "🏆",
     "desc": "Conclua 30 dias do desafio.", "metric": "completed_days", "target": 30},
    {"key": "mestre_agua", "name": "Mestre da Água", "emoji": "💧",
     "desc": "Bata a meta de água em 15 dias.", "metric": "habit:agua", "target": 15},
    {"key": "rei_disciplina", "name": "Rei da Disciplina", "emoji": "👑",
     "desc": "Cumpra todos os hábitos em 20 dias.", "metric": "all_habits_days", "target": 20},
    {"key": "leitor", "name": "Leitor Consistente", "emoji": "📚",
     "desc": "Cumpra o hábito de leitura em 20 dias.", "metric": "habit:leitura", "target": 20},
    {"key": "mente_forte", "name": "Mente Forte", "emoji": "🧠",
     "desc": "Conclua 10 desafios da categoria Mental.", "metric": "cat:Mental", "target": 10},
    {"key": "gentileza", "name": "Gentileza em Ação", "emoji": "🤝",
     "desc": "Conclua 10 desafios da categoria Social.", "metric": "cat:Social", "target": 10},
    {"key": "treino_sempre", "name": "Nunca faltou um treino", "emoji": "💪",
     "desc": "Conclua 15 desafios da categoria Física.", "metric": "cat:Física", "target": 15},
    {"key": "superacao", "name": "Superação", "emoji": "⚡",
     "desc": "Conclua 5 desafios surpresa.", "metric": "surprise_done", "target": 5},
    {"key": "casal_inabalavel", "name": "Casal Inabalável", "emoji": "💞",
     "desc": "Vocês dois concluírem o mesmo dia (dia perfeito em conjunto).",
     "metric": "casal", "target": 1},
]

# --- Status de humor -------------------------------------------------------
MOODS = [
    {"key": "otimo", "emoji": "😄", "label": "Ótimo"},
    {"key": "bem", "emoji": "🙂", "label": "Bem"},
    {"key": "neutro", "emoji": "😐", "label": "Neutro"},
    {"key": "baixo", "emoji": "😕", "label": "Baixo"},
    {"key": "dificil", "emoji": "😫", "label": "Difícil"},
]

# --- Mensagem do dia (motivacional, determinística por data) ---------------
MOTD_POOL = [
    "Constância vence intensidade — um passo hoje vale mais que dez amanhã.",
    "Você não precisa ser perfeito, só precisa não desistir.",
    "Disciplina é lembrar do que você quer de verdade.",
    "Pequenos hábitos, grandes mudanças. Comece agora.",
    "Foco no progresso, não na perfeição.",
    "Grandes conquistas nascem de dias comuns bem vividos.",
    "Cuide do hoje; o amanhã agradece.",
    "Evoluir juntos é mais leve — puxa seu par pra cima.",
    "A vitória de hoje é ter tentado de novo.",
    "Regue todo dia: é assim que as coisas crescem.",
    "Você é a soma dos seus pequenos hábitos.",
    "Não conte os dias — faça os dias contarem.",
    "A motivação te inicia; o hábito te mantém.",
    "Respira, agradece e segue. Um dia de cada vez.",
    "Seja 1% melhor que ontem.",
    "O segundo melhor momento para começar é agora.",
    "Gratidão transforma o que temos em suficiente.",
    "Sua sequência é a prova de que você é capaz.",
    "Força e constância: o resto é consequência.",
    "Feito é melhor que perfeito. Bora fazer.",
]

# --- Incentivos genéricos (usados quando não há nudge contextual) ----------
ENCOURAGEMENTS = [
    "Bora! Cada hábito conta. 💪",
    "Tá quase — não deixa pra amanhã. 🔥",
    "Orgulho de você por continuar. 👏",
    "Respira e faz o próximo. Um de cada vez. 🌱",
    "Hoje é dia de virar o jogo. 😏",
    "Seu eu do futuro agradece. ✨",
]
