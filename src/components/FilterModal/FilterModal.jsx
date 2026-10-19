import { useEffect, useRef, useState } from "react";
import Modal from "../Modal/Modal.jsx";
import Button from "../Button/Button.jsx";
import TextField from "../TextField/TextField.jsx";
import {
  FILTROS_PADRAO,
  OPCOES_CARRINHO,
  OPCOES_ESTOQUE,
  OPCOES_ORDEM,
  validarFiltros,
} from "../../utils/filtros.js";
import { formatarDecimal, lerDecimal } from "../../utils/formatadores.js";
import "./FilterModal.css";

function precoParaTexto(valor) {
  return valor == null ? "" : formatarDecimal(valor);
}

function textoParaPreco(texto) {
  const valor = lerDecimal(texto);
  return Number.isNaN(valor) ? null : valor;
}

function Secao({ titulo, children }) {
  return (
    <fieldset className="filtros__secao">
      <legend className="filtros__legenda">
        <h3 className="filtros__titulo-secao">{titulo}</h3>
      </legend>
      <div className="filtros__opcoes">{children}</div>
    </fieldset>
  );
}

function Opcao({ tipo, nome, valor, marcado, aoMudar, rotulo }) {
  return (
    <label className="filtros__opcao">
      <input type={tipo} name={nome} value={valor} checked={marcado} onChange={aoMudar} />
      <span>{rotulo}</span>
    </label>
  );
}

/**
 * TL17 Modal de Filtros. Os filtros só valem ao clicar em "Aplicar filtros";
 * "Limpar filtros" volta ao padrão; "X" e Esc fecham sem aplicar.
 *
 * mostrarCarrinho: seção "Carrinho" (só no Catálogo)
 * mostrarAbaixoMinimo: opção "Estoque abaixo do mínimo" (Entrada e Saída)
 */
export default function FilterModal({
  aberto,
  aoFechar,
  filtros,
  aoAplicar,
  categorias,
  mostrarCarrinho = false,
  mostrarAbaixoMinimo = false,
}) {
  const [rascunho, setRascunho] = useState(filtros);
  const [textoMinimo, setTextoMinimo] = useState("");
  const [textoMaximo, setTextoMaximo] = useState("");
  const [erro, setErro] = useState("");
  const minimoRef = useRef(null);

  // Ao abrir, o rascunho parte dos filtros aplicados.
  useEffect(() => {
    if (!aberto) return;
    setRascunho(filtros);
    setTextoMinimo(precoParaTexto(filtros.precoMinimo));
    setTextoMaximo(precoParaTexto(filtros.precoMaximo));
    setErro("");
  }, [aberto, filtros]);

  function alternarCategoria(categoriaId) {
    setRascunho((atual) => ({
      ...atual,
      categorias: atual.categorias.includes(categoriaId)
        ? atual.categorias.filter((id) => id !== categoriaId)
        : [...atual.categorias, categoriaId],
    }));
  }

  function aplicar() {
    const novos = {
      ...rascunho,
      precoMinimo: textoParaPreco(textoMinimo),
      precoMaximo: textoParaPreco(textoMaximo),
    };
    const mensagem = validarFiltros(novos);
    if (mensagem) {
      setErro(mensagem);
      minimoRef.current?.focus();
      return;
    }
    aoAplicar(novos);
    aoFechar();
  }

  function limpar() {
    aoAplicar(FILTROS_PADRAO);
    aoFechar();
  }

  const opcoesEstoque = mostrarAbaixoMinimo
    ? OPCOES_ESTOQUE
    : OPCOES_ESTOQUE.filter((opcao) => opcao.valor !== "abaixo-minimo");

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Filtros"
      tamanho="medio"
      mostrarFechar
      rodape={
        <>
          <Button variante="secundario" onClick={limpar}>
            Limpar filtros
          </Button>
          <Button onClick={aplicar}>Aplicar filtros</Button>
        </>
      }
    >
      <div className="filtros">
        <Secao titulo="Categoria">
          {categorias.map((categoria) => (
            <Opcao
              key={categoria.id}
              tipo="checkbox"
              nome="categoria"
              valor={categoria.id}
              marcado={rascunho.categorias.includes(categoria.id)}
              aoMudar={() => alternarCategoria(categoria.id)}
              rotulo={categoria.nome}
            />
          ))}
        </Secao>

        <Secao titulo="Preço">
          <div className="filtros__precos">
            <TextField
              ref={minimoRef}
              rotulo="Mínimo"
              inputMode="decimal"
              autoComplete="off"
              placeholder="R$ 0,00"
              value={textoMinimo}
              onChange={(evento) => {
                setTextoMinimo(evento.target.value.replace(/[^\d.,]/g, ""));
                setErro("");
              }}
              erro={erro}
            />
            <TextField
              rotulo="Máximo"
              inputMode="decimal"
              autoComplete="off"
              placeholder="R$ 0,00"
              value={textoMaximo}
              onChange={(evento) => {
                setTextoMaximo(evento.target.value.replace(/[^\d.,]/g, ""));
                setErro("");
              }}
            />
          </div>
        </Secao>

        <Secao titulo="Estoque">
          {opcoesEstoque.map((opcao) => (
            <Opcao
              key={opcao.valor}
              tipo="radio"
              nome="estoque"
              valor={opcao.valor}
              marcado={rascunho.estoque === opcao.valor}
              aoMudar={() => setRascunho((atual) => ({ ...atual, estoque: opcao.valor }))}
              rotulo={opcao.rotulo}
            />
          ))}
        </Secao>

        {mostrarCarrinho && (
          <Secao titulo="Carrinho">
            {OPCOES_CARRINHO.map((opcao) => (
              <Opcao
                key={opcao.valor}
                tipo="radio"
                nome="carrinho"
                valor={opcao.valor}
                marcado={rascunho.carrinho === opcao.valor}
                aoMudar={() => setRascunho((atual) => ({ ...atual, carrinho: opcao.valor }))}
                rotulo={opcao.rotulo}
              />
            ))}
          </Secao>
        )}

        <Secao titulo="Ordenar por">
          {OPCOES_ORDEM.map((opcao) => (
            <Opcao
              key={opcao.valor}
              tipo="radio"
              nome="ordem"
              valor={opcao.valor}
              marcado={rascunho.ordem === opcao.valor}
              aoMudar={() => setRascunho((atual) => ({ ...atual, ordem: opcao.valor }))}
              rotulo={opcao.rotulo}
            />
          ))}
        </Secao>
      </div>
    </Modal>
  );
}
