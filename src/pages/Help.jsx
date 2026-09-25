import { useState } from "react";
import testActiveImage from "../assets/help/image1.png";
import testInactiveImage from "../assets/help/image2.png";
import resetFlowersImage from "../assets/help/image3.png";
import "./Help.css";

const videoUrl = "https://fisga.sfo3.cdn.digitaloceanspaces.com/export-1790297933846.mp4";

export default function HelpPage() {
  const [videoError, setVideoError] = useState(false);

  return (
    <main className="help-page">
      <article className="help-article">
        <header className="help-header">
          <p className="help-eyebrow">FEMAMA · Guia de ativação</p>
          <h1>Como configurar a ativação</h1>
          <p>Prepare os dispositivos, configure a exibição da árvore e deixe a pesquisa pronta para receber os participantes.</p>
        </header>

        <nav className="help-contents" aria-label="Neste artigo">
          <strong>Neste artigo</strong>
          <ol>
            <li><a href="#dispositivos">Dispositivos necessários</a></li>
            <li><a href="#televisao">Configuração da televisão</a></li>
            <li><a href="#tablets">Configuração dos tablets</a></li>
            <li><a href="#inicio">Início da ativação</a></li>
          </ol>
        </nav>

        <section id="dispositivos">
          <h2>1. Dispositivos necessários</h2>
          <ul>
            <li><strong>2 tablets.</strong></li>
            <li><strong>1 notebook com saída HDMI.</strong></li>
            <li><strong>1 televisão com entrada HDMI:</strong> para exibir a árvore com as flores e as mensagens personalizadas de quem responder à pesquisa.</li>
            <li><strong>1 cabo HDMI:</strong> para conectar o notebook à televisão.</li>
          </ul>
          <aside className="help-note">Os tablets e o notebook precisam estar <strong>conectados à internet durante toda a ativação</strong>. A televisão receberá a imagem pelo cabo HDMI e não precisa de conexão própria com a internet.</aside>
        </section>

        <section id="televisao">
          <h2>2. Configuração da televisão</h2>
          <ol>
            <li>Conecte o notebook à televisão usando o cabo HDMI.</li>
            <li>Na televisão, selecione a entrada HDMI correspondente.</li>
            <li>No notebook, abra a página da árvore: <a href="https://femamagame.vercel.app/tree" target="_blank" rel="noreferrer">femamagame.vercel.app/tree</a>.</li>
            <li>Siga o vídeo abaixo para concluir a configuração da exibição.</li>
          </ol>
          <figure className="help-video">
            <video controls playsInline preload="metadata" aria-label="Vídeo de configuração da exibição da árvore" onError={() => setVideoError(true)}>
              <source src={videoUrl} type="video/mp4" />
              Seu navegador não suporta a reprodução deste vídeo. <a href={videoUrl}>Abra o vídeo de configuração.</a>
            </video>
            <figcaption>Vídeo de configuração · <a href={videoUrl} target="_blank" rel="noreferrer">Abrir vídeo em nova aba</a></figcaption>
          </figure>
          {videoError && <p role="alert">Não foi possível carregar o vídeo. Verifique sua conexão ou use o link acima para abri-lo em outra aba.</p>}
          <p>Mantenha o notebook ligado, conectado à internet e com a página aberta durante toda a ativação.</p>
        </section>

        <section id="tablets">
          <h2>3. Configuração dos tablets</h2>
          <p>Os dois tablets devem abrir a <strong>página inicial da pesquisa</strong>, <a href="https://femamagame.vercel.app/" target="_blank" rel="noreferrer">femamagame.vercel.app</a>, no Google Chrome em modo quiosque.</p>
          <p>O <strong>Web Kiosk do Samsung Knox Manage</strong> exibe o site em tela cheia, sem a barra de endereço e as abas do navegador. Assim, o tablet fica dedicado à pesquisa.</p>
          <h3>Acessar o aplicativo Knox Manage</h3>
          <ol>
            <li>Acesse o <a href="https://www.samsungknox.com/" target="_blank" rel="noreferrer">portal Samsung Knox</a> e entre com a conta de administrador da organização.</li>
            <li>Abra o <strong>Aplicativo Knox Manage</strong> dentro do Tablet.</li>
            <li>Confirme que os dois tablets estão cadastrados e disponíveis para gerenciamento.</li>
          </ol>
          <h3>Configurar o Web Kiosk</h3>
          <p>No <strong>console novo do Knox Manage</strong>:</p>
          <ol>
            <li>Na etapa de configuração, abra <strong>Kiosk settings</strong> e selecione <strong>Web mode</strong>.</li>
            <li>Em <strong>Default URL</strong>, insira o endereço da página inicial da pesquisa.</li>
            <li>Ative <strong>Hide info icon</strong> para ocultar o ícone de informações do quiosque.</li>
            <li>Desative <strong>System status bar</strong> e <strong>Notification bar</strong> para ocultar as informações do sistema.</li>
            <li>Desative <strong>Home button</strong> e <strong>Recent apps</strong> para restringir o acesso a outras telas.</li>
            <li>Salve e aplique o perfil aos dois tablets.</li>
          </ol>
          <p><strong>Passo a passo oficial:</strong> <a href="https://docs.samsungknox.com/admin/knox-manage/new-console/configure-kiosks/build-a-web-mode-kiosk/" target="_blank" rel="noreferrer">Configurar um Web Kiosk no Knox Manage — Samsung</a> (em inglês; utilize a tradução do navegador para português).</p>
        </section>

        <section id="inicio">
          <h2>4. Início da ativação</h2>
          <p>Antes de iniciar, deixe o modo de teste da árvore <strong>desativado</strong>. Se o painel mostrar o botão <strong>Remover teste</strong>, clique nele para desativar o teste.</p>
          <div className="help-examples">
            <figure>
              <img className="help-test-active" src={testActiveImage} width="424" height="188" loading="lazy" alt="Painel da árvore com o teste ativo e o botão Remover teste." />
              <figcaption>Clique em "Remover Teste"</figcaption>
            </figure>
            <figure>
              <img className="help-test-inactive" src={testInactiveImage} width="398" height="146" loading="lazy" alt="Painel da árvore com o teste desativado e o botão Popular 40 flores." />
              <figcaption><strong>Teste desativado:</strong> estado correto para começar.</figcaption>
            </figure>
          </div>
          <p>Na página <a href="https://femamagame.vercel.app/admin" target="_blank" rel="noreferrer">femamagame.vercel.app/admin</a>, exclua todas as flores de respostas de teste feitas até então.</p>
          <figure>
            <img src={resetFlowersImage} width="741" height="360" loading="lazy" alt="Confirmação para excluir todas as flores no painel de administração, com os botões Cancelar e Excluir todas as flores." />
            <figcaption>Confirme a exclusão das flores de teste antes de receber os participantes.</figcaption>
          </figure>
          <aside className="help-note">Lembre-se de <strong>fechar o painel de configuração da árvore</strong> usando o botão no canto superior direito.</aside>
        </section>
        <footer className="help-footer"><a href="#">Voltar ao início do guia ↑</a></footer>
      </article>
    </main>
  );
}
