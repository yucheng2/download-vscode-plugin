import { useState } from 'react'
import './App.css'

export function App() {
  const [inputUrl, setInputUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');
  const [officialUrl, setOfficialUrl] = useState('');

  const parseVSIXUrl = async (id: string) => {
    const itemMatch = id.match(/(?:itemName=)?([^.]+)\.([^&]+)/);
    const versionMatch = id.match(/version=([^&]+)/);

    if (!itemMatch) {
      throw new Error('无效的VS Code插件市场URL');
    }

    let version = versionMatch?.[1];
    
    if (!version) {
      try {
        const apiResponse = await fetch('https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json;api-version=3.1-preview.1'
          },
          body: JSON.stringify({
            filters: [{
              criteria: [
                { filterType: 7, value: itemMatch[1] + '.' + itemMatch[2] }
              ]
            }],
            flags: 2151
          })
        });
        
        if (!apiResponse.ok) {
          throw new Error(`API请求失败: ${apiResponse.status} ${apiResponse.statusText}`);
        }
        const data = await apiResponse.json();
        
        if (!data?.results?.[0]?.extensions?.[0]?.versions?.[0]?.version) {
          throw new Error('无效的API响应结构');
        }
        version = data.results[0].extensions[0].versions[0].version;
        console.log('成功获取最新版本:', version);
      } catch (err) {
        throw new Error('获取最新版本失败: ' + err.message);
      }
    }

    return {
      fieldA: itemMatch[1],
      fieldB: itemMatch[2],
      version: version,
      officialUrl: `https://marketplace.visualstudio.com/items?itemName=${itemMatch[1]}.${itemMatch[2]}`
    };
  };

  const handleConvert = async () => {
    try {
      const { fieldA, fieldB, version, officialUrl } = await parseVSIXUrl(inputUrl);
      const newUrl = `https://marketplace.visualstudio.com/_apis/public/gallery/publishers/${fieldA}/vsextensions/${fieldB}/${version}/vspackage`;
      setDownloadUrl(newUrl);
      setOfficialUrl(officialUrl);
      setError('');
    } catch (err) {
      setError(err.message);
      setDownloadUrl('');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(downloadUrl);
      alert('链接已复制到剪贴板');
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  return (
    <div className="app-container">
      <h1>VS Code插件下载链接转换器</h1>
      <div className="input-group">
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="输入插件id"
        />
        <button onClick={handleConvert}>转换</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {downloadUrl && (
        <div className="result-container">
          <h3>下载链接：</h3>
          <div className="download-link">
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
              {downloadUrl}
            </a>
            <button onClick={copyToClipboard}>复制</button>
          </div>
          <h3>官方地址：</h3>
          <a href={officialUrl} target="_blank" rel="noopener noreferrer">
            {officialUrl}
          </a>
        </div>
      )}
    </div>
  );
}

export default App

