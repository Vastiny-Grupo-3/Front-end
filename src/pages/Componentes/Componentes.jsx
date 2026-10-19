import { useState } from "react";
import {
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import Button from "../../components/Button/Button.jsx";
import TextField from "../../components/TextField/TextField.jsx";
import TextArea from "../../components/TextArea/TextArea.jsx";
import SearchField from "../../components/SearchField/SearchField.jsx";
import MoneyPercentField from "../../components/MoneyPercentField/MoneyPercentField.jsx";
import Stepper from "../../components/Stepper/Stepper.jsx";
import Modal from "../../components/Modal/Modal.jsx";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal.jsx";
import DataTable from "../../components/DataTable/DataTable.jsx";
import EmptyState from "../../components/EmptyState/EmptyState.jsx";
import StatusBadge from "../../components/StatusBadge/StatusBadge.jsx";
import StatCard from "../../components/StatCard/StatCard.jsx";
import Tabs from "../../components/Tabs/Tabs.jsx";
import ProductCard from "../../components/ProductCard/ProductCard.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { formatarMoeda } from "../../utils/formatadores.js";
import "./Componentes.css";

/*
 * Página temporária (Etapa 4) para conferir visualmente os componentes base.
 * Será removida quando as telas reais existirem.
 */

const PRODUTOS = [
  { id: 1, nome: "Buzina Caracol 12V", categoria: "Buzinas", valorVenda: 89.9, quantidade: 14 },
  { id: 2, nome: "Chicote Farol H4", categoria: "Chicotes", valorVenda: 45, quantidade: 3 },
  { id: 3, nome: "Soquete Lâmpada H7", categoria: "Soquetes", valorVenda: 12.5, quantidade: 0 },
];

const ESTOQUE = [
  { id: 1, produto: "Buzina Caracol 12V", categoria: "Buzinas", atual: 14, minimo: 5, estado: "Bom" },
  { id: 2, produto: "Chicote Farol H4", categoria: "Chicotes", atual: 3, minimo: 4, estado: "Ruim" },
  { id: 3, produto: "Soquete Lâmpada H7", categoria: "Soquetes", atual: 0, minimo: 10, estado: "Crítico" },
  { id: 4, produto: "Relé Auxiliar 40A", categoria: "Acessórios", atual: 7, minimo: 6, estado: "Médio" },
];

const COLUNAS_ESTOQUE = [
  { chave: "produto", titulo: "Produto", ordenavel: true },
  { chave: "categoria", titulo: "Categoria", ordenavel: true },
  { chave: "atual", titulo: "Estoque atual", ordenavel: true, alinhamento: "direita" },
  { chave: "minimo", titulo: "Mínimo", ordenavel: true, alinhamento: "direita" },
  {
    chave: "estado",
    titulo: "Estado",
    ordenavel: true,
    renderizar: (linha) => <StatusBadge estado={linha.estado} />,
  },
];

const VENDAS = [
  { transacao: "0142", cliente: "João Pereira", valor: 250, lucro: 92.5, qtd: 7, data: "12/10/2026" },
  { transacao: "0141", cliente: null, valor: 89.9, lucro: 31.4, qtd: 1, data: "11/10/2026" },
];

const ABAS_HISTORICO = [
  { id: "vendas", rotulo: "Vendas", cor: "var(--cor-aba-vendas)" },
  { id: "clientes", rotulo: "Clientes", cor: "var(--cor-aba-clientes)" },
  { id: "entrada", rotulo: "Entrada", cor: "var(--cor-aba-entrada)" },
  { id: "saida", rotulo: "Saída", cor: "var(--cor-aba-saida)" },
  { id: "cadastro-produtos", rotulo: "Cadastro de Produtos", cor: "var(--cor-aba-cadastro-produtos)" },
  { id: "cadastro-clientes", rotulo: "Cadastro de Clientes", cor: "var(--cor-aba-cadastro-clientes)" },
];

function Secao({ titulo, children }) {
  return (
    <section className="vitrine__secao" aria-labelledby={`secao-${titulo}`}>
      <h2 id={`secao-${titulo}`}>{titulo}</h2>
      {children}
    </section>
  );
}

function Exemplo({ titulo, children, coluna = false }) {
  return (
    <div className="vitrine__exemplo">
      <h3 className="vitrine__subtitulo">{titulo}</h3>
      <div className={coluna ? "vitrine__coluna" : "vitrine__linha"}>{children}</div>
    </div>
  );
}

export default function Componentes() {
  const { mostrarToast } = useToast();
  const [pesquisa, setPesquisa] = useState("");
  const [desconto, setDesconto] = useState(10);
  const [quantidadeCarrinho, setQuantidadeCarrinho] = useState(2);
  const [quantidadeEntrada, setQuantidadeEntrada] = useState(2);
  const [modal, setModal] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [erroModal, setErroModal] = useState("");
  const [abaAtiva, setAbaAtiva] = useState("vendas");
  const [estadoTabela, setEstadoTabela] = useState("padrao");
  const [noCarrinho, setNoCarrinho] = useState(false);

  const valorLinha = quantidadeCarrinho * 80;
  const corAba = ABAS_HISTORICO.find((aba) => aba.id === abaAtiva).cor;

  function fecharModal() {
    setModal(null);
    setEnviando(false);
    setErroModal("");
  }

  function simularEnvio() {
    setEnviando(true);
    setTimeout(() => {
      setEnviando(false);
      setErroModal("Não conseguimos salvar. Verifique sua conexão e tente novamente.");
    }, 1200);
  }

  return (
    <div className="vitrine">
      <h1>Componentes</h1>
      <p className="vitrine__intro">
        Página temporária para conferência visual. Passe o mouse e use Tab para ver os estados de
        hover e foco.
      </p>

      <Secao titulo="Botão">
        <Exemplo titulo="Primário">
          <Button>Adicionar ao Carrinho</Button>
          <Button icone={Plus}>Cadastrar Novo Cliente</Button>
          <Button disabled>Finalizar Compra</Button>
          <Button carregando>Entrar</Button>
        </Exemplo>
        <Exemplo titulo="Secundário">
          <Button variante="secundario">Cancelar</Button>
          <Button variante="secundario" icone={SlidersHorizontal}>
            Filtros
          </Button>
          <Button variante="secundario" disabled>
            Limpar filtros
          </Button>
          <Button variante="secundario" carregando>
            Continuar comprando
          </Button>
        </Exemplo>
        <Exemplo titulo="Destrutivo">
          <Button variante="destrutivo">Excluir Carrinho</Button>
          <Button variante="destrutivo" disabled>
            Excluir do Carrinho
          </Button>
          <Button variante="destrutivo" carregando>
            Excluir conta
          </Button>
        </Exemplo>
        <Exemplo titulo="Ícone">
          <Button variante="icone" icone={Search} aria-label="Pesquisar" />
          <Button variante="icone" icone={ShoppingCart} aria-label="Carrinho" />
          <Button variante="icone" icone={ShoppingCart} aria-label="Carrinho" aria-current="page" />
          <Button variante="icone" icone={X} aria-label="Fechar" />
          <Button variante="icone" icone={Plus} aria-label="Novo carrinho" />
          <Button variante="icone" icone={MoreHorizontal} aria-label="Ver detalhes" />
          <Button variante="icone" icone={Eye} aria-label="Detalhes" />
          <Button variante="icone" icone={Pencil} aria-label="Editar" />
          <Button variante="icone" icone={Trash2} aria-label="Excluir" />
          <Button variante="icone" icone={Trash2} aria-label="Excluir" disabled />
        </Exemplo>
      </Secao>

      <Secao titulo="Campos de formulário">
        <div className="vitrine__grade-campos">
          <TextField rotulo="Nome" obrigatorio placeholder="Nome do cliente" />
          <TextField
            rotulo="Telefone"
            obrigatorio
            type="tel"
            erro="Informe o telefone do cliente."
            defaultValue=""
          />
          <TextField rotulo="E-mail" type="email" placeholder="exemplo@email.com" />
          <TextField
            rotulo="Senha"
            type="password"
            placeholder="Digite sua senha"
            ajuda="Mínimo de 8 caracteres, com pelo menos uma letra e um número."
          />
          <TextField rotulo="Código" defaultValue="BZ-012" disabled />
          <TextField rotulo="Categoria" defaultValue="Buzinas" carregando />
          <TextField rotulo="Data Início" type="date" />
          <TextField rotulo="Data Fim" type="date" erro="A data inicial não pode ser depois da data final." />
        </div>
        <TextArea rotulo="Justificativa" obrigatorio erro="Informe uma justificativa." />
        <TextArea rotulo="Descrição" />
        <Exemplo titulo="Pesquisa" coluna>
          <SearchField
            rotulo="Pesquisar produtos"
            placeholder="Pesquisar produtos"
            valor={pesquisa}
            aoMudar={setPesquisa}
            aoPesquisar={(termo) =>
              mostrarToast({ variante: "informacao", mensagem: `Pesquisa: ${termo || "(vazia)"}` })
            }
          />
        </Exemplo>
      </Secao>

      <Secao titulo="Campo de desconto duplo">
        <p className="vitrine__nota">
          Linha: {quantidadeCarrinho} × {formatarMoeda(80)} = {formatarMoeda(valorLinha)} · desconto
          atual {formatarMoeda(desconto)} · total do item {formatarMoeda(valorLinha - desconto)}
        </p>
        <div className="vitrine__largura-media">
          <MoneyPercentField valorLinha={valorLinha} desconto={desconto} aoMudar={setDesconto} />
          <MoneyPercentField rotulo="Desconto (carrinho finalizado)" valorLinha={160} desconto={10} disabled />
        </div>
      </Secao>

      <Secao titulo="Quantidade (Stepper)">
        <Exemplo titulo="Carrinho: − valor + (estoque 5)">
          <Stepper
            valor={quantidadeCarrinho}
            aoMudar={setQuantidadeCarrinho}
            min={1}
            max={5}
          />
        </Exemplo>
        <Exemplo titulo="Entrada e Saída: -1 valor +1">
          <Stepper
            rotulo="Adicionar"
            variante="unitario"
            valor={quantidadeEntrada}
            aoMudar={setQuantidadeEntrada}
            min={1}
          />
          <Stepper rotulo="Diminuir" variante="unitario" valor={1} min={1} max={3} disabled />
        </Exemplo>
      </Secao>

      <Secao titulo="Modal">
        <Exemplo titulo="Tamanhos e variantes">
          <Button variante="secundario" onClick={() => setModal("pequeno")}>
            Abrir confirmação (pequeno)
          </Button>
          <Button variante="secundario" onClick={() => setModal("medio")}>
            Abrir formulário (médio)
          </Button>
          <Button variante="secundario" onClick={() => setModal("grande")}>
            Abrir detalhes (grande)
          </Button>
        </Exemplo>
      </Secao>

      <Secao titulo="Notificação (toast)">
        <Exemplo titulo="Variantes">
          <Button
            variante="secundario"
            onClick={() =>
              mostrarToast({ variante: "sucesso", mensagem: "Conta cadastrada com sucesso." })
            }
          >
            Sucesso
          </Button>
          <Button
            variante="secundario"
            onClick={() =>
              mostrarToast({
                variante: "erro",
                mensagem: "Não conseguimos salvar. Verifique sua conexão e tente novamente.",
              })
            }
          >
            Erro
          </Button>
          <Button
            variante="secundario"
            onClick={() =>
              mostrarToast({ variante: "informacao", mensagem: "Carrinho Atual: Carrinho 029" })
            }
          >
            Informação
          </Button>
        </Exemplo>
      </Secao>

      <Secao titulo="Tabela">
        <Exemplo titulo="Estado da tabela">
          {["padrao", "carregando", "vazio", "erro"].map((estado) => (
            <Button
              key={estado}
              variante={estadoTabela === estado ? "primario" : "secundario"}
              aria-pressed={estadoTabela === estado}
              onClick={() => setEstadoTabela(estado)}
            >
              {{ padrao: "Padrão", carregando: "Carregando", vazio: "Vazio", erro: "Erro" }[estado]}
            </Button>
          ))}
        </Exemplo>
        <DataTable
          legenda="Estoque"
          legendaOculta={false}
          colunas={COLUNAS_ESTOQUE}
          linhas={estadoTabela === "vazio" ? [] : ESTOQUE}
          estado={estadoTabela === "vazio" ? "padrao" : estadoTabela}
          linhaSelecionada={2}
          aoTentarNovamente={() => setEstadoTabela("padrao")}
        />
        <EmptyState mensagem="Nenhum cliente cadastrado. Use “Cadastrar Novo Cliente” para começar.">
          <Button icone={Plus}>Cadastrar Novo Cliente</Button>
        </EmptyState>
      </Secao>

      <Secao titulo="Selo de estado">
        <div className="vitrine__linha">
          <StatusBadge estado="Crítico" />
          <StatusBadge estado="Ruim" />
          <StatusBadge estado="Médio" />
          <StatusBadge estado="Bom" />
        </div>
      </Secao>

      <Secao titulo="Indicador">
        <div className="vitrine__grade-indicadores">
          <StatCard rotulo="Vendas no período" valor="128" />
          <StatCard rotulo="Faturamento do período" valor={formatarMoeda(18430.5)} />
          <StatCard rotulo="Preço médio das vendas" estado="carregando" />
          <StatCard rotulo="Produtos ativos" estado="vazio" />
          <StatCard rotulo="Valor Total" estado="erro" />
        </div>
      </Secao>

      <Secao titulo="Abas do Histórico">
        <Tabs rotulo="Histórico" abas={ABAS_HISTORICO} abaAtiva={abaAtiva} aoMudar={setAbaAtiva}>
          <DataTable
            legenda={ABAS_HISTORICO.find((aba) => aba.id === abaAtiva).rotulo}
            variante="conteiner"
            corFundo={corAba}
            chaveLinha="transacao"
            colunas={[
              { chave: "transacao", titulo: "Transação" },
              { chave: "cliente", titulo: "Cliente", renderizar: (linha) => linha.cliente ?? "Sem Cliente" },
              { chave: "valor", titulo: "Valor", renderizar: (linha) => formatarMoeda(linha.valor) },
              { chave: "lucro", titulo: "Lucro", renderizar: (linha) => formatarMoeda(linha.lucro) },
              { chave: "qtd", titulo: "Qtd. Produtos", renderizar: (linha) => `${linha.qtd} unidade(s)` },
              { chave: "data", titulo: "Dt. Venda" },
              {
                chave: "acoes",
                titulo: "Ações",
                renderizar: () => (
                  <Button variante="icone" icone={MoreHorizontal} aria-label="Ver detalhes" />
                ),
              },
            ]}
            linhas={abaAtiva === "vendas" ? VENDAS : []}
          />
        </Tabs>
      </Secao>

      <Secao titulo="Card de produto">
        <Exemplo titulo="Catálogo">
          <div className="vitrine__grade-produtos">
            <ProductCard
              produto={PRODUTOS[0]}
              noCarrinho={noCarrinho}
              aoAdicionar={() => setNoCarrinho(true)}
              aoRemover={() => setNoCarrinho(false)}
              nivelTitulo={4}
            />
            <ProductCard produto={PRODUTOS[1]} noCarrinho nivelTitulo={4} />
            <ProductCard produto={PRODUTOS[2]} nivelTitulo={4} />
          </div>
        </Exemplo>
        <Exemplo titulo="Entrada, Saída e carregando">
          <div className="vitrine__grade-produtos">
            <ProductCard produto={PRODUTOS[0]} variante="entrada" nivelTitulo={4} />
            <ProductCard produto={PRODUTOS[1]} variante="saida" nivelTitulo={4} />
            <ProductCard carregando />
          </div>
        </Exemplo>
      </Secao>

      <ConfirmModal
        aberto={modal === "pequeno"}
        aoCancelar={fecharModal}
        aoConfirmar={fecharModal}
        titulo="Tem certeza que deseja excluir o cliente 'João Pereira'?"
        destrutivo
      />

      <Modal
        aberto={modal === "medio"}
        aoFechar={fecharModal}
        titulo="Cadastrar Novo Cliente"
        erro={erroModal}
        rodape={
          <>
            <Button variante="secundario" onClick={fecharModal} disabled={enviando}>
              Cancelar
            </Button>
            <Button onClick={simularEnvio} carregando={enviando}>
              Confirmar
            </Button>
          </>
        }
      >
        <TextField rotulo="Nome" obrigatorio disabled={enviando} />
        <TextField rotulo="Telefone" type="tel" obrigatorio disabled={enviando} />
        <TextArea rotulo="Descrição" disabled={enviando} />
      </Modal>

      <Modal
        aberto={modal === "grande"}
        aoFechar={fecharModal}
        titulo="Detalhes"
        tamanho="grande"
        focoInicial="titulo"
        mostrarFechar
      >
        <DataTable
          legenda="Produtos da venda"
          colunas={[
            { chave: "produto", titulo: "Nome do Produto" },
            { chave: "preco", titulo: "Preço na época", renderizar: (linha) => formatarMoeda(linha.preco) },
            { chave: "lucro", titulo: "Lucro na época", renderizar: (linha) => formatarMoeda(linha.lucro) },
            { chave: "unidades", titulo: "Unidades compradas" },
          ]}
          linhas={[
            { id: 1, produto: "Buzina Caracol 12V", preco: 20, lucro: 7.5, unidades: 5 },
            { id: 2, produto: "Chicote Farol H4", preco: 80, lucro: 30, unidades: 2 },
          ]}
        />
      </Modal>
    </div>
  );
}
