"""Conteúdo do desafio: hábitos, pools de desafios (por dificuldade) e conquistas.

Tudo aqui é dado "de catálogo" (não muda em runtime), consumido pela lógica de
pontuação em ``scoring.py``. Cada dia gera 5 desafios (um por área ativa), e
cada área tem pools separados por dificuldade — Fácil / Médio / Difícil — com
pontuações crescentes. As 5 áreas: Física, Mental, Social, Relação, Espiritual.
"""

# --- Hábitos ---------------------------------------------------------------
# Conjunto padrão. O grupo pode adicionar QUANTOS hábitos quiser nas configs.
DEFAULT_HABITS = [
    {"key": "agua", "label": "Beber 2,5L de água", "emoji": "💧", "category": "Saúde"},
    {"key": "sono", "label": "Dormir no mínimo 7h30", "emoji": "😴", "category": "Saúde"},
    {"key": "refeicoes", "label": "Não pular refeições", "emoji": "🍽️", "category": "Saúde"},
    {"key": "leitura", "label": "Ler 10 páginas (ou 15 min)", "emoji": "📖", "category": "Mental"},
    {"key": "devocional", "label": "Fazer o devocional", "emoji": "🙏", "category": "Espiritual"},
]

# Sugestões prontas (o grupo pode ativar estas além de criar as suas).
HABITS_MENU = DEFAULT_HABITS + [
    {"key": "proteina", "label": "Bater a meta de proteína", "emoji": "🥩", "category": "Saúde"},
    {"key": "passos", "label": "Caminhar 8.000 passos", "emoji": "🚶", "category": "Corpo"},
    {"key": "alongar", "label": "Alongar por 10 minutos", "emoji": "🤸", "category": "Corpo"},
    {"key": "orar", "label": "Orar", "emoji": "🕊️", "category": "Espiritual"},
    {"key": "cama", "label": "Arrumar a cama", "emoji": "🛏️", "category": "Organização"},
    {"key": "tarefas", "label": "Não deixar tarefas acumuladas", "emoji": "✅", "category": "Organização"},
]

# --- Desafios por categoria e dificuldade ----------------------------------
# Cada dia sorteia (determinístico por data) uma dificuldade + um item por área.
CHALLENGE_POOLS = {
    "Física": {
        "facil": [
            "Subir escadas em vez de usar o elevador hoje.",
            "Alongar por 15 minutos.",
            "Caminhar 8 mil passos.",
            "Fazer um treino de mobilidade.",
            "Fazer 30 agachamentos.",
        ],
        "medio": [
            "Fazer um exercício que você normalmente evita.",
            "Caminhar 12 mil passos.",
            "Completar um treino sem pausas longas.",
            "Treinar ao ar livre.",
            "Pedalar por 40 minutos.",
            "Bater seu recorde na prancha.",
        ],
        "dificil": [
            "Correr 5 km.",
            "Fazer 100 agachamentos.",
            "Fazer 60 flexões (pode dividir ao longo do dia).",
            "Fazer um HIIT completo.",
            "Caminhar 15 mil passos.",
            "Experimentar um esporte novo por pelo menos 1h.",
        ],
    },
    "Mental": {
        "facil": [
            "Meditar por 10 minutos.",
            "Escrever 3 coisas pelas quais você é grato.",
            "Resolver um quebra-cabeça ou sudoku.",
            "Fazer uma atividade sem música e sem celular.",
            "Fazer uma lista de prioridades para a semana.",
        ],
        "medio": [
            "Ficar 2 horas sem redes sociais.",
            "Meditar por 15 minutos.",
            "Escrever em um diário.",
            "Assistir a uma palestra educativa.",
            "Refletir sobre um erro e escrever o aprendizado.",
        ],
        "dificil": [
            "Escrever suas metas para os próximos 6 meses.",
            "Aprender algo novo por 30 minutos e anotar o que aprendeu.",
            "Organizar completamente um ambiente.",
            "Passar o dia inteiro sem reclamar (registre se conseguiu).",
            "Ficar 4 horas seguidas sem redes sociais.",
        ],
    },
    "Social": {
        "facil": [
            "Elogiar sinceramente três pessoas.",
            "Fazer uma ligação para um familiar.",
            "Perguntar genuinamente como alguém está e ouvir com atenção.",
            "Passar uma refeição inteira sem o celular.",
        ],
        "medio": [
            "Conversar com alguém com quem você não fala há muito tempo.",
            "Ajudar alguém sem esperar retorno.",
            "Escrever uma mensagem de agradecimento a alguém.",
            "Convidar alguém para caminhar ou treinar junto.",
            "Fazer uma refeição em família sem distrações.",
        ],
        "dificil": [
            "Conhecer uma pessoa nova de verdade.",
            "Ter uma conversa de pelo menos 30 minutos com alguém importante.",
            "Fazer um ato de gentileza anônimo.",
            "Reconectar-se pessoalmente com um amigo distante.",
        ],
    },
    "Relação": {
        "facil": [
            "Dar um elogio sincero sobre algo além da aparência.",
            "Relembrar juntos uma memória boa de vocês.",
            "Fazer uma tarefa do outro sem ele(a) pedir.",
            "Agradecer juntos por algo do relacionamento.",
        ],
        "medio": [
            "Cozinhar uma refeição juntos.",
            "Treinar ou caminhar em casal.",
            "Escrever um bilhete ou carta para o(a) parceiro(a).",
            "Perguntar 'como posso te apoiar essa semana?' e agir nisso.",
            "Desligar as telas 1h antes de dormir e conversar.",
        ],
        "dificil": [
            "Planejar e ter um encontro (date) sem celular.",
            "Ter uma conversa de 30 min sobre sonhos e planos do casal.",
            "Definir juntos uma meta em comum para o mês.",
            "Resolver um desentendimento com calma, sem elevar a voz.",
        ],
    },
    "Espiritual": {
        "facil": [
            "Ouvir um louvor refletindo sobre a letra.",
            "Fazer um momento de silêncio e reflexão.",
            "Anotar três motivos de gratidão a Deus.",
            "Orar por alguém específico.",
        ],
        "medio": [
            "Ler um capítulo da Bíblia.",
            "Decorar um versículo.",
            "Escrever um testemunho.",
            "Compartilhar uma palavra de incentivo baseada na Bíblia.",
        ],
        "dificil": [
            "Ler três capítulos e escrever uma reflexão.",
            "Passar 30 minutos em oração/meditação.",
            "Jejuar de algo por um dia com propósito de oração.",
            "Servir voluntariamente alguém em necessidade.",
        ],
    },
}

# Ordem das áreas (também usada como ordem dos 5 desafios do dia).
CATEGORY_ORDER = ["Física", "Mental", "Social", "Relação", "Espiritual"]

CATEGORY_EMOJI = {
    "Física": "💪",
    "Mental": "🧠",
    "Social": "🤝",
    "Relação": "💞",
    "Espiritual": "🙏",
}

# --- Dificuldades ----------------------------------------------------------
DIFFICULTIES = ["facil", "medio", "dificil"]
DIFFICULTY_POINTS = {"facil": 10, "medio": 25, "dificil": 45}
DIFFICULTY_LABEL = {"facil": "Fácil", "medio": "Médio", "dificil": "Difícil"}

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
     "desc": "Conclua 10 desafios da área Mental.", "metric": "cat:Mental", "target": 10},
    {"key": "gentileza", "name": "Gentileza em Ação", "emoji": "🤝",
     "desc": "Conclua 10 desafios da área Social.", "metric": "cat:Social", "target": 10},
    {"key": "treino_sempre", "name": "Nunca faltou um treino", "emoji": "💪",
     "desc": "Conclua 15 desafios da área Física.", "metric": "cat:Física", "target": 15},
    {"key": "equilibrio", "name": "Equilíbrio", "emoji": "⚖️",
     "desc": "Feche as 5 áreas no mesmo dia 5 vezes.", "metric": "balance_days", "target": 5},
    {"key": "superacao", "name": "Superação", "emoji": "⚡",
     "desc": "Conclua 5 desafios difíceis.", "metric": "hard_done", "target": 5},
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

# --- Incentivos genéricos --------------------------------------------------
ENCOURAGEMENTS = [
    "Bora! Cada área conta. 💪",
    "Tá quase — não deixa pra amanhã. 🔥",
    "Orgulho de você por continuar. 👏",
    "Respira e faz o próximo. Um de cada vez. 🌱",
    "Hoje é dia de virar o jogo. 😏",
    "Seu eu do futuro agradece. ✨",
]
