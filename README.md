# Presidente: A Luta pelo Acesso

Jogo de gerenciamento de futebol brasileiro de navegador, desenvolvido com arquitetura modular em **JavaScript (ES Modules)**, **Tailwind CSS** e **HTML5**.

## 🚀 Como Executar o Jogo
1. Certifique-se de que todos os arquivos estejam na estrutura correta de pastas (`css/`, `js/`).
2. Abra a pasta do projeto no **VS Code**.
3. Utilize a extensão **Live Server** (clique com o botão direito em `index.html` e selecione *Open with Live Server*). O uso de um servidor local é obrigatório para carregar ES Modules corretamente via protocolo `http://`.

## 📂 Organização dos Módulos JavaScript (`js/`)
- **`state.js`**: Estado central imutável/mutável do jogo, dados do clube, elenco, comissão, finanças, dados políticos e salvamento padrão.
- **`save.js`**: Gerenciamento de salvamento automático e manual no `localStorage`, validação de dados e migração retrocompatível do save.
- **`finances.js`**: Controle de caixa, livro-caixa, despesas mensais, patrocínios, bilheteria e manutenção da base.
- **`matches.js`**: Simulador de partidas oficiais com mandos de campo reais, bilheteria baseada em público pagante e tabela de classificação.
- **`staff.js`**: Contratação de profissionais da comissão técnica e aplicação de habilidades estratégicas reais (ex: *Treinador Midiático* e bônus de mando).
- **`academy.js`**: Infraestrutura da base, olheiros, evolução de jovens atletas e promoção para o profissional.
- **`politics.js`**: Lógica do Sistema Político, sustentação no Conselho Deliberativo, bancadas/grupos políticos, articulações com custos reais, promessas políticas e eventos extraordinários.
- **`elections.js`**: Cálculo de confiança da torcida, apuração eleitoral bianual (mandato de 2 temporadas), apoio do conselho e condições de game over (demissão, falência ou impeachment).
- **`game.js`**: Orquestrador do avanço de turnos (mensal), processamento de eventos aleatórios, partidas e turnos.
- **`ui.js`**: Renderização em tempo real de todas as abas, modais, cores personalizadas do clube, aba Política e eventos de interface.
- **`main.js`**: Ponto de entrada que inicializa os módulos, ouvintes de eventos e o ciclo de vida da aplicação.