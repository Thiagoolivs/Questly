"""Conteúdo do desafio: hábitos, pools de desafios (por dificuldade) e conquistas.

Tudo aqui é dado "de catálogo" (não muda em runtime), consumido pela lógica de
pontuação em ``scoring.py``. Cada dia gera 5 desafios (um por área ativa), e
cada área tem pools separados por dificuldade — Fácil / Médio / Difícil — com
pontuações crescentes. As 5 áreas: Física, Mental, Social, Relação, Espiritual.
"""

# Hábitos são pessoais (models.Habit / presets.HABIT_PRESETS). Os "hábitos
# fixos do grupo" que moravam aqui saíram: eram configuráveis nas opções do
# grupo e nenhuma tela do app sabia marcá-los, então só duplicavam o conceito
# e travavam o dia perfeito, que exigia todos eles cumpridos.

# --- Desafios por categoria e dificuldade ----------------------------------
# Cada dia sorteia (determinístico por data) uma dificuldade + um item por área.
CHALLENGE_POOLS = {
    "Física": {
        "facil": [
            "Circuito rápido: 3 rodadas de 10 flexões + 15 abdominais + 20 agachamentos.",
            "Fazer 3 séries de prancha de 30 segundos.",
            "Fazer 30 agachamentos + 20 abdominais ao longo do dia.",
            "Subir escadas em vez do elevador o dia todo.",
            "Alongar o corpo inteiro por 15 minutos.",
            "Caminhar 8 mil passos.",
            "Fazer um treino de mobilidade de 15 minutos.",
        ],
        "medio": [
            "Circuito de força: 4 rodadas de 15 flexões + 25 abdominais + 30 agachamentos + 40s de prancha.",
            "Fazer 50 flexões e 100 abdominais (pode dividir ao longo do dia).",
            "Prancha acumulando 3 minutos no total (várias séries).",
            "Fazer 80 agachamentos + 60 abdominais.",
            "Completar um treino de 30 min sem pausas longas.",
            "Caminhar ou correr 12 mil passos.",
            "Pedalar ou correr por 40 minutos.",
        ],
        "dificil": [
            "Circuito completo: 5 rodadas de 20 flexões + 30 abdominais + 40 agachamentos + 1 min de prancha.",
            "Fazer 100 flexões no dia (pode dividir em séries).",
            "Fazer 150 abdominais e 100 agachamentos.",
            "Correr 5 km.",
            "Fazer um HIIT completo de 25 minutos.",
            "Prancha acumulando 5 minutos no total.",
            "Caminhar 15 mil passos + 50 flexões.",
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

CATEGORY_ICON = {
    "Física": "dumbbell",
    "Mental": "brain",
    "Social": "handshake",
    "Relação": "heart",
    "Espiritual": "heart-handshake",
}

# --- Dificuldades ----------------------------------------------------------
DIFFICULTIES = ["facil", "medio", "dificil"]
DIFFICULTY_POINTS = {"facil": 10, "medio": 25, "dificil": 45}
DIFFICULTY_LABEL = {"facil": "Fácil", "medio": "Médio", "dificil": "Difícil"}

# --- Conquistas ------------------------------------------------------------
# Cada conquista define uma métrica e um alvo; a checagem fica em scoring.py.
#
# `group_types` e `needs_areas` dizem quando a conquista faz sentido. Sem isso,
# um grupo de cinco pessoas via "Casal Inabalável" — que ninguém ali pode
# desbloquear — e quem desligou a área Mental via uma medalha presa para
# sempre. Conquista impossível não motiva, atrapalha.
#
# Pelo mesmo motivo saíram as três que mediam os "hábitos fixos" do grupo:
# nenhuma tela do app sabia marcá-los, então elas nunca sairiam do zero. Hábito
# agora é pessoal, e as conquistas dele estão em PERSONAL_ACHIEVEMENTS.
ACHIEVEMENTS = [
    {"key": "primeiros_7", "name": "Primeiros 7 dias", "icon": "medal",
     "desc": "Conclua 7 dias do desafio.", "metric": "completed_days", "target": 7},
    {"key": "consecutivos_10", "name": "10 dias consecutivos", "icon": "flame",
     "desc": "Alcance uma sequência de 10 dias.", "metric": "best_streak", "target": 10},
    {"key": "completos_30", "name": "30 dias completos", "icon": "trophy",
     "desc": "Conclua 30 dias do desafio.", "metric": "completed_days", "target": 30},
    {"key": "mente_forte", "name": "Mente Forte", "icon": "brain",
     "desc": "Conclua 10 desafios da área Mental.", "metric": "cat:Mental", "target": 10,
     "needs_areas": ["Mental"]},
    {"key": "gentileza", "name": "Gentileza em Ação", "icon": "handshake",
     "desc": "Conclua 10 desafios da área Social.", "metric": "cat:Social", "target": 10,
     "needs_areas": ["Social"]},
    {"key": "treino_sempre", "name": "Nunca faltou um treino", "icon": "dumbbell",
     "desc": "Conclua 15 desafios da área Física.", "metric": "cat:Física", "target": 15,
     "needs_areas": ["Física"]},
    {"key": "equilibrio", "name": "Equilíbrio", "icon": "scale",
     "desc": "Feche as 5 áreas no mesmo dia 5 vezes.", "metric": "balance_days", "target": 5,
     "needs_areas": CATEGORY_ORDER},
    {"key": "superacao", "name": "Superação", "icon": "zap",
     "desc": "Conclua 5 desafios difíceis.", "metric": "hard_done", "target": 5},
    {"key": "casal_inabalavel", "name": "Casal Inabalável", "icon": "heart",
     "desc": "Vocês dois concluírem o mesmo dia (dia perfeito em conjunto).",
     "metric": "casal", "target": 1, "group_types": ["couple"]},
]

# --- Conquistas do progresso pessoal ---------------------------------------
# As de cima medem o desafio do grupo (hábitos fixos, desafio do dia, dia
# perfeito do casal). Estas medem o que a pessoa faz sozinha — hábito próprio,
# rotina, treino, sequência — e por isso valem em qualquer espaço, inclusive
# individual. Sem elas, quem usa o app pelo Meu Dia não tinha medalha nenhuma
# ao alcance: todas as 11 antigas dependiam de uma parte do app que essa pessoa
# talvez nem abra.
#
# `metric` é resolvido em main.py (personal_metrics), a partir dos logs.
PERSONAL_ACHIEVEMENTS = [
    {"key": "p_primeiro_dia", "name": "Primeiro dia fechado", "icon": "check-circle",
     "desc": "Feche tudo que vencia num dia.", "metric": "full_days", "target": 1},
    {"key": "p_semana", "name": "Semana inteira", "icon": "flame",
     "desc": "Alcance 7 dias seguidos.", "metric": "best_streak", "target": 7},
    {"key": "p_mes", "name": "Um mês de pé", "icon": "trophy",
     "desc": "Alcance 30 dias seguidos.", "metric": "best_streak", "target": 30},
    {"key": "p_cem_dias", "name": "Cem dias", "icon": "crown",
     "desc": "Alcance 100 dias seguidos.", "metric": "best_streak", "target": 100},
    {"key": "p_habitos_50", "name": "Cinquenta marcas", "icon": "list-check",
     "desc": "Cumpra 50 hábitos.", "metric": "habits_done", "target": 50},
    {"key": "p_habitos_365", "name": "Trezentos e sessenta e cinco", "icon": "medal",
     "desc": "Cumpra 365 hábitos.", "metric": "habits_done", "target": 365},
    {"key": "p_rotinas_30", "name": "Rotina de verdade", "icon": "repeat",
     "desc": "Feche 30 rotinas.", "metric": "routines_done", "target": 30},
    {"key": "p_treinos_10", "name": "Dez treinos", "icon": "dumbbell",
     "desc": "Registre 10 atividades.", "metric": "records", "target": 10},
    {"key": "p_treinos_100", "name": "Cem treinos", "icon": "zap",
     "desc": "Registre 100 atividades.", "metric": "records", "target": 100},
    {"key": "p_variedade", "name": "Corpo completo", "icon": "scale",
     "desc": "Registre 5 modalidades diferentes.", "metric": "modalities", "target": 5},
    {"key": "p_distancia", "name": "Cem quilômetros", "icon": "footprints",
     "desc": "Some 100 km entre corrida, caminhada, bike e natação.",
     "metric": "distance_km", "target": 100},
    {"key": "p_plano", "name": "Plano cumprido", "icon": "clipboard-list",
     "desc": "Conclua 12 sessões de um plano de treino.",
     "metric": "training_sessions", "target": 12},
    {"key": "p_nivel_5", "name": "Nível 5", "icon": "star",
     "desc": "Chegue ao nível 5.", "metric": "level", "target": 5},
    {"key": "p_nivel_10", "name": "Nível 10", "icon": "crown",
     "desc": "Chegue ao nível 10.", "metric": "level", "target": 10},
    # Descanso planejado é parte do treino, não o oposto dele — a medalha
    # existe para dizer isso em voz alta a quem acha que folgar é falhar.
    {"key": "p_descanso", "name": "Descanso é treino", "icon": "moon",
     "desc": "Planeje 5 dias de descanso.", "metric": "rest_days", "target": 5},
]


# --- Reações do feed (estilo LinkedIn) -------------------------------------
# Cada membro pode dar UMA reação por item do feed (toca outra troca; toca a
# mesma remove).
# Emoji aqui é intencional: reagir no feed e escrever nas mensagens do grupo
# são os dois únicos lugares do app onde eles continuam.
FEED_REACTIONS = [
    {"key": "apoio", "emoji": "\U0001F44F", "label": "Apoio"},
    {"key": "amei", "emoji": "\u2764\ufe0f", "label": "Amei"},
    {"key": "forca", "emoji": "\U0001F525", "label": "Força"},
    {"key": "mandou", "emoji": "\U0001F4AA", "label": "Mandou bem"},
    {"key": "grato", "emoji": "\U0001F64F", "label": "Grato"},
    {"key": "haha", "emoji": "\U0001F602", "label": "Haha"},
]

# --- Sugestões de atividades em dupla --------------------------------------
# Atividades extras feitas juntos (pontuam para os dois). O grupo também pode
# registrar as suas próprias.
JOINT_SUGGESTIONS = [
    {"icon": "utensils", "label": "Cozinhar uma refeição juntos"},
    {"icon": "footprints", "label": "Caminhar juntos"},
    {"icon": "dumbbell", "label": "Treinar juntos"},
    {"icon": "heart-handshake", "label": "Orar / devocional juntos"},
    {"icon": "clapperboard", "label": "Assistir algo e conversar sobre"},
    {"icon": "sparkles", "label": "Organizar um ambiente juntos"},
    {"icon": "message-circle", "label": "1h de conversa sem telas"},
    {"icon": "sunrise", "label": "Ver o nascer/pôr do sol juntos"},
]

# --- Status de humor / emoções (múltipla escolha) --------------------------
MOODS = [
    {"key": "otimo", "icon": "smile", "label": "Ótimo"},
    {"key": "feliz", "icon": "smile", "label": "Feliz"},
    {"key": "grato", "icon": "heart-handshake", "label": "Grato"},
    {"key": "calmo", "icon": "leaf", "label": "Calmo"},
    {"key": "motivado", "icon": "flame", "label": "Motivado"},
    {"key": "produtivo", "icon": "zap", "label": "Produtivo"},
    {"key": "neutro", "icon": "meh", "label": "Neutro"},
    {"key": "cansado", "icon": "moon", "label": "Cansado"},
    {"key": "ansioso", "icon": "wind", "label": "Ansioso"},
    {"key": "estressado", "icon": "flame", "label": "Estressado"},
    {"key": "triste", "icon": "cloud-rain", "label": "Triste"},
    {"key": "dificil", "icon": "cloud-lightning", "label": "Difícil"},
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
    "Bora! Cada área conta.",
    "Tá quase — não deixa pra amanhã.",
    "Orgulho de você por continuar.",
    "Respira e faz o próximo. Um de cada vez.",
    "Hoje é dia de virar o jogo.",
    "Seu eu do futuro agradece.",
]
