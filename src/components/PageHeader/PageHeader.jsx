import { useEffect } from "react";
import { ShoppingCart } from "lucide-react";
import Button from "../Button/Button.jsx";
import SearchField from "../SearchField/SearchField.jsx";
import { useCart } from "../../context/CartContext.jsx";
import "./PageHeader.css";

/**
 * Cabeçalho de página: título (h1) à esquerda; à direita, pesquisa,
 * botão-ícone de carrinho e ação principal, quando a tela tiver.
 *
 * pesquisa: { rotulo, placeholder, valor, aoMudar, aoPesquisar }
 * carrinho: { ativo } — o ícone sempre abre o modal do carrinho (TL02);
 *   `ativo` preenche o ícone na tela do Carrinho.
 * acao: botão de ação principal (nó React).
 */
export default function PageHeader({ titulo, subtitulo, pesquisa, carrinho, acao }) {
  const { abrirModal } = useCart();
  useEffect(() => {
    document.title = `${titulo} | Vastiny`;
  }, [titulo]);

  const temControles = pesquisa || carrinho || acao;

  return (
    <header className="cabecalho">
      <div className="cabecalho__titulos">
        <h1 className="cabecalho__titulo">{titulo}</h1>
        {subtitulo && <p className="cabecalho__subtitulo">{subtitulo}</p>}
      </div>
      {temControles && (
        <div className="cabecalho__controles">
          {pesquisa && (
            <SearchField
              className="cabecalho__pesquisa"
              rotulo={pesquisa.rotulo}
              placeholder={pesquisa.placeholder}
              valor={pesquisa.valor}
              aoMudar={pesquisa.aoMudar}
              aoPesquisar={pesquisa.aoPesquisar}
            />
          )}
          {carrinho && (
            <Button
              variante="icone"
              icone={ShoppingCart}
              aria-label="Carrinho"
              aria-current={carrinho.ativo ? "page" : undefined}
              onClick={abrirModal}
            />
          )}
          {acao}
        </div>
      )}
    </header>
  );
}
