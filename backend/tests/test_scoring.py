"""Regras de pontuação que não podem regredir.

Cada teste aqui corresponde a uma forma concreta de inflar pontuação. Se algum
falhar, o ranking virou farmável — não relaxe o teste sem decidir isso de fato.

Rodar:  cd backend && python -m pytest tests/ -q
"""
from app import scoring_v2 as sc


class TestIntensidadeDeclarada:
    """A intensidade autodeclarada não pode ser alavanca de pontuação."""

    def test_com_dado_objetivo_a_declaracao_quase_nao_muda_nada(self):
        corrida = {"distance": 5, "duration": 30}
        leve = sc.compute_effort_score({**corrida, "intensity": "leve"}, "corrida")
        extremo = sc.compute_effort_score({**corrida, "intensity": "extremo"}, "corrida")
        assert extremo / leve < 1.15

    def test_sem_dado_objetivo_a_declaracao_pesa_mais_mas_e_limitada(self):
        leve = sc.compute_effort_score({"duration": 60, "intensity": "leve"}, "musculacao")
        extremo = sc.compute_effort_score({"duration": 60, "intensity": "extremo"}, "musculacao")
        assert 1.4 < extremo / leve < 1.5


class TestRitmo:
    """Percurso pontua por distância; arrastar o tempo não pode render mais."""

    def test_mesma_distancia_ritmo_melhor_pontua_mais(self):
        forte = sc.compute_effort_score({"distance": 10, "duration": 38}, "corrida")
        devagar = sc.compute_effort_score({"distance": 10, "duration": 80}, "corrida")
        assert forte > devagar

    def test_passeio_longo_nao_supera_treino_forte(self):
        forte = sc.compute_effort_score({"distance": 10, "duration": 38}, "corrida")
        arrastado = sc.compute_effort_score({"distance": 12, "duration": 120}, "corrida")
        assert arrastado < forte


class TestPlausibilidade:
    """Números impossíveis são corrigidos, e o usuário é avisado."""

    def test_distancia_impossivel_para_o_tempo_e_cortada(self):
        clean, notes = sc.normalize_params({"distance": 100, "duration": 20}, "corrida")
        assert clean["distance"] < 100
        assert notes

    def test_duracao_absurda_e_limitada(self):
        clean, notes = sc.normalize_params({"duration": 5000}, "corrida")
        assert clean["duration"] == sc.MAX_DURATION_MIN
        assert notes


class TestTetos:
    def test_teto_por_atividade(self):
        enorme = sc.compute_effort_score({"duration": 600, "intensity": "extremo"}, "jiu-jitsu")
        assert enorme <= sc.MAX_EFFORT_PER_ACTIVITY

    def test_repeticao_tem_retorno_decrescente(self):
        assert [sc.repeat_factor(i) for i in range(6)] == [1.0, 0.5, 0.25, 0.1, 0.1, 0.1]

    def test_repetir_dez_vezes_nao_rende_dez_vezes(self):
        uma = sc.compute_effort_score({"duration": 60}, "corrida")
        total = acumulado = 0.0
        for i in range(10):
            ganho = sc.competitive_effort(uma, i, acumulado)
            acumulado += ganho
            total += ganho
        assert total < uma * 2.6
        assert total <= sc.MAX_EFFORT_PER_DAY

    def test_teto_diario_vale_mesmo_com_modalidades_diferentes(self):
        acumulado = 0.0
        for _ in range(30):
            acumulado += sc.competitive_effort(140, 0, acumulado)
        assert acumulado <= sc.MAX_EFFORT_PER_DAY


class TestConsistencia:
    """Consistência é razão do planejado cumprido, não contagem de itens."""

    def test_criar_muitos_habitos_triviais_nao_rende_mais(self):
        assert sc.compute_consistency_score(3, 3) == sc.compute_consistency_score(30, 30) == 100.0

    def test_metade_cumprida(self):
        assert sc.compute_consistency_score(10, 5) == 50.0

    def test_descanso_planejado_nao_penaliza(self):
        assert sc.compute_consistency_score(planned=10, done=8, rest_days=2) == 100.0

    def test_sem_nada_planejado_nao_da_pontos(self):
        assert sc.compute_consistency_score(0, 0) == 0.0


class TestXPeRanking:
    def test_xp_e_pessoal_e_sem_teto_competitivo(self):
        assert sc.xp_for(100) == 1000
        assert sc.level_for(2500) == 3

    def test_consistencia_sozinha_nao_ganha_de_esforco(self):
        so_consistencia = sc.total_competitive(effort=0, consistency=100, challenge=0)
        com_esforco = sc.total_competitive(effort=100, consistency=0, challenge=0)
        assert com_esforco > so_consistencia


class TestConstancia:
    """Hábito e rotina pontuam pouco — mas pontuam, e a sequência recompensa."""

    def test_habito_rende_menos_que_rotina_fechada(self):
        assert sc.habit_points(1, 0, 0) < sc.habit_points(0, 1, 0)

    def test_constancia_nao_encosta_num_treino_de_verdade(self):
        # Cinco hábitos + a rotina + o dia completo ainda valem menos que meia
        # hora de corrida: constância é o piso, não o atalho para o topo.
        dia_inteiro = sc.habit_points(5, 1, 1)
        corrida = sc.compute_effort_score({"distance": 5, "duration": 30}, "corrida")
        assert dia_inteiro < corrida

    def test_bonus_de_sequencia_e_acumulado_por_marco(self):
        assert sc.streak_bonus(2) == 0
        assert sc.streak_bonus(3) > 0
        assert sc.streak_bonus(7) > sc.streak_bonus(3)
        # Entre marcos o bônus não muda: é marco, não pontinho por dia.
        assert sc.streak_bonus(4) == sc.streak_bonus(3)

    def test_quebrar_a_sequencia_devolve_o_bonus(self):
        assert sc.streak_bonus(0) == 0

    def test_proximo_marco_sempre_a_frente(self):
        proximo = sc.next_streak_milestone(5)
        assert proximo["days"] == 7 and proximo["missing"] == 2
        assert sc.next_streak_milestone(10**6) is None

    def test_constancia_entra_no_total_sem_dominar(self):
        so_habitos = sc.total_competitive(0, 0, 0, habits=sc.habit_points(5, 1, 1))
        um_treino = sc.total_competitive(
            sc.compute_effort_score({"distance": 5, "duration": 30}, "corrida"), 0, 0
        )
        assert 0 < so_habitos < um_treino
