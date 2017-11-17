import axios from 'axios'
import retry from 'bluebird-retry'

import webpackSources from 'webpack-sources'


function TinyPlugin(options) {
  this.options = options || {
    MAX_TRY: 10,
    MAX_TIME: 10000
  };
}

//todo assets rename,
//todo just change src
TinyPlugin.prototype.getUrl = function(url) {
  const _this = this;
  function promiseFactory(){
    return new Promise((resolve,reject) => {
      axios({
        url: url,
        timeout: _this.options.MAX_TIME,
        method: 'get',
        responseType:'arraybuffer'
      }).then((r)=>{
        resolve(r.data)
      },(err)=>{
        reject(err)
      })
    })
  }
  return promiseFactory();
}
TinyPlugin.prototype.postUrl = function(data) {
  const _this = this;
  function promiseFactory(){
    return new Promise((resolve,reject) => {
      axios({method: 'post' ,
        headers: {
          "Accept" : "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Encoding" : "gzip, deflate",
          "Accept-Language" : "zh-cn,zh;q=0.8,en-us;q=0.5,en;q=0.3",
          "Cache-Control" : "no-cache",
          "Pragma" : "no-cache",
          "Connection"  : "keep-alive",
          "Host" : "tinypng.com",
          "DNT" : 1,
          "Referer" : "https://tinypng.com/",
          "User-Agent" : "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:42.0) Gecko/20100101 Firefox/42.0"
        },
        timeout: _this.options.MAX_TIME,
        url:'https://tinypng.com/web/shrink',
        data: data
      }).then((res)=>{
        resolve(res.data.output.url)
      },(err)=>{
        reject(err)
      });
    })
  }
  return promiseFactory();
}


TinyPlugin.prototype.tiny = async function(assets,filename){
  try {
    const url = await retry(this.postUrl.bind(this,assets[filename].source()),{max_tries:this.options.MAX_TRY});
    const rawData = await retry(this.getUrl.bind(this,url),{max_tries:this.options.MAX_TRY});
    console.log(filename,'=> success')
    assets[filename] = new webpackSources.RawSource(rawData)
    return Promise.resolve();
  }catch(e){
    console.log(filename,'=>fail')
    return Promise.resolve();
  }
}

TinyPlugin.prototype.apply = function(compiler) {
  compiler.plugin('emit', (compilation,callback)=> {
    let pngs = [];
    for(var filename in compilation.assets){
      if(filename.indexOf('png')>-1){
        pngs.push(filename);
      }
    }
    Promise.all(pngs.map((filename)=>this.tiny(compilation.assets,filename))).then(()=>{
      callback()
    })
  });
};

module.exports = TinyPlugin;

