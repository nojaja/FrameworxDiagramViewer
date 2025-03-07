const https = require('https');
const fs = require('fs');
const path = require('path');

class DownloadFontPlugin {
  constructor(options = {}) {
    // フォントの設定
    this.fontSettings = {
      fill: options.fill || 0,
      weight: options.weight || 300,
      grade: options.grade || 0,
      opticalSize: options.opticalSize || 20
    };

    // 使用するアイコンの設定
    this.icons = options.icons || [];

    // パラメータとアイコンハッシュをファイル名に含める
    const iconsHash = this.icons.length > 0 ? this.generateIconsHash(this.icons) : 'default';
    this.fontFileName = `material-symbols-f${this.fontSettings.fill}w${this.fontSettings.weight}g${this.fontSettings.grade}o${this.fontSettings.opticalSize}-${iconsHash}.woff2`;
    this.cssFileName = 'material-symbols.css';  // CSSファイル名を固定

    // Google Fonts APIのURL
    this.cssUrl = 'https://fonts.googleapis.com/css2' +
      '?family=Material+Symbols+Outlined' +
      ':opsz,wght,FILL,GRAD@' +
      `${this.fontSettings.opticalSize},${this.fontSettings.weight},${this.fontSettings.fill},${this.fontSettings.grade}` +
      '&display=swap' +
      (this.icons.length > 0 ? `&text=${this.icons.join('+')}` : '');
  }

  // アイコンリストからハッシュを生成
  generateIconsHash(icons) {
    const str = icons.sort().join(',');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 8);
  }

  apply(compiler) {
    compiler.hooks.beforeRun.tapAsync('DownloadFontPlugin', async (compilation, callback) => {
      const fontDir = path.resolve(compiler.context, 'src/assets/fonts');
      if (!fs.existsSync(fontDir)) {
        fs.mkdirSync(fontDir, { recursive: true });
      }

      const fontPath = path.join(fontDir, this.fontFileName);
      const cssPath = path.join(fontDir, this.cssFileName);

      try {
        // フォントファイルが既に存在する場合はスキップ
        if (fs.existsSync(fontPath) && fs.existsSync(cssPath)) {
          console.log(`Font files already exist: ${this.fontFileName}`);
          callback();
          return;
        }

        // 既存のフォントファイルを削除
        this.cleanupOldFonts(fontDir);

        // 1. CSSファイルの取得とパース
        const cssContent = await this.fetchWithUserAgent(this.cssUrl);
        console.log('URL:', this.cssUrl);
        console.log('Fetched CSS content:', cssContent);
        
        // 2. CSSからwoff2のURLを抽出
        const woff2Url = this.extractWoff2Url(cssContent);
        if (!woff2Url) {
          console.error('CSS content:', cssContent);
          throw new Error('Could not find woff2 URL in CSS');
        }
        console.log('Extracted woff2 URL:', woff2Url);
        // 3. woff2ファイルをダウンロード
        await this.downloadFont(woff2Url.replace(/['"]/g, ''), fontPath);
        
        // 4. ローカルパスとカスタム設定を使用するようにCSSを修正
        const localCss = this.generateLocalCss();
        fs.writeFileSync(cssPath, localCss);
        
        console.log(`Generated font files: ${this.fontFileName}`);
        callback();
      } catch (err) {
        console.error('Error in DownloadFontPlugin:', err);
        callback(err);
      }
    });
  }

  // User-Agentを指定してCSSを取得
  async fetchWithUserAgent(url) {
    return new Promise((resolve, reject) => {
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
          'Accept': 'text/css,*/*;q=0.1',
          'Accept-Encoding': 'gzip, deflate, br',
          'sec-ch-ua': '"Chromium";v="122"',
          'sec-ch-ua-platform': '"Windows"'
        }
      };
      
      https.get(url, options, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to fetch CSS: ${res.statusCode}`));
          return;
        }

        // gzipレスポンスを処理
        if (res.headers['content-encoding'] === 'gzip' ||
            res.headers['content-encoding'] === 'br') {
          const zlib = require('zlib');
          const stream = res.headers['content-encoding'] === 'br' ? 
            zlib.createBrotliDecompress() : zlib.createGunzip();
          
          res.pipe(stream);
          let data = '';
          stream.on('data', chunk => data += chunk);
          stream.on('end', () => resolve(data));
          stream.on('error', reject);
        } else {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve(data));
        }
      }).on('error', reject);
    });
  }

  // 古いバージョンのフォントファイルを削除
  cleanupOldFonts(fontDir) {
    const files = fs.readdirSync(fontDir);
    files.forEach(file => {
      if (file.startsWith('material-symbols-') && 
         (file !== this.fontFileName)) {
        fs.unlinkSync(path.join(fontDir, file));
      }
    });
  }

  // フォントURLを抽出
  extractWoff2Url(css) {
    // URLを探す
    const urlMatch = css.match(/src:\s*url\((.*?)\)\s+format\(['"](?:truetype|ttf|woff2)['"]\)/);
    if (!urlMatch) return null;

    let fontUrl = urlMatch[1].replace(/['"]/g, '');
    // TTFをWOFF2に変換（Google Fontsの規則に従う）
    return fontUrl.replace(/\.ttf$/, '.woff2');
  }

  // ローカル用のCSSを生成
  generateLocalCss() {
    return `/* Material Symbols Outlined */
@font-face {
  font-family: 'Material Symbols Outlined';
  font-style: normal;
  font-weight: ${this.fontSettings.weight};
  font-display: block;
  src: url('./${this.fontFileName}') format('woff2');
}

.material-symbols-outlined {
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  font-feature-settings: 'liga';
  -webkit-font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
  font-variation-settings:
    'FILL' ${this.fontSettings.fill},
    'wght' ${this.fontSettings.weight},
    'GRAD' ${this.fontSettings.grade},
    'opsz' ${this.fontSettings.opticalSize};
}`;
  }

  // フォントファイルのダウンロード
  downloadFont(url, filePath) {
    return new Promise((resolve, reject) => {
      https.get(url, response => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download font: ${response.statusCode}`));
          return;
        }
        const fileStream = fs.createWriteStream(filePath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
      }).on('error', reject);
    });
  }
}

module.exports = DownloadFontPlugin;
