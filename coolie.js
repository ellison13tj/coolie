/*!
 * coolie 苦力
 * @author ydr.me
 * @version 0.9.0
 * @license MIT
 */


/**
 * 路径关系
 * coolie.js => page
 * coolie-config.js => coolie.js
 * base => coolie-config.js
 */


(function () {
    'use strict';

    /**
     * coolie 版本号
     * @type {string}
     */
    var version = '0.9.0';


    /**
     * @type {undefined}
     */
    var udf;


    /**
     * 获取当前时间戳
     * @returns {Number}
     */
    var now = function () {
        return new Date().getTime();
    };


    /**
     * 当前时间
     * @type {Number}
     */
    var timeNow = 0;


    /**
     * window
     * @type {Window}
     */
    var win = window;


    /**
     * document
     * @type {HTMLDocument}
     */
    var doc = win.document;


    /**
     * coolie 配置
     * @property base {String} 模块入口基准路径
     * @property host {String} 模块入口 host
     * @property version {Object} 入口模块版本 map
     * @type {Object}
     */
    var coolieConfig = {};


    /**
     * coolie 回调列表
     * @type {Array}
     */
    var coolieCallbacks = [];


    /**
     * 判断数据类型
     * @param obj
     * @returns {string}
     */
    var typeis = function (obj) {
        return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
    };


    /**
     * 判断是否为数组
     * @param obj
     * @returns {Boolean}
     * @private
     */
    var isArray = function (obj) {
        return typeis(obj) === 'array';
    };


    /**
     * 判断是否为函数
     * @param obj
     * @returns {Boolean}
     * @private
     */
    var isFunction = function (obj) {
        return typeis(obj) === 'function';
    };


    /**
     * 判断是否为字符串
     * @param obj
     * @returns {Boolean}
     * @private
     */
    var isString = function (obj) {
        return typeis(obj) === 'string';
    };


    /**
     * 遍历
     * @param list
     * @param callback {Function} 返回 false，中断当前循环
     * @param [isReverse=false] {Boolean} 是否反序
     * @private
     */
    var each = function (list, callback, isReverse) {
        var i;
        var j;

        if (isArray(list)) {
            for (i = isReverse ? list.length - 1 : 0, j = isReverse ? 0 : list.length;
                 isReverse ? i > j : i < j;
                 isReverse ? i-- : i++) {
                if (callback(i, list[i]) === false) {
                    break;
                }
            }
        } else if (typeof(list) === 'object') {
            for (i in list) {
                if (callback(i, list[i]) === false) {
                    break;
                }
            }
        }
    };


    /**
     * 定义 console，防止出错
     */
    var console = (function () {
        var ret = {};
        var hasConsole = win.console;
        var arr = ['log', 'warn', 'group', 'groupEnd'];

        each(arr, function (index, key) {
            ret[key] = function () {
                if (!coolieConfig.debug) {
                    return;
                }

                if (hasConsole && hasConsole[key]) {
                    try {
                        hasConsole[key].apply(hasConsole, arguments);
                    } catch (err) {
                        //ignore
                    }
                }
            };
        });

        return ret;
    })();


    /**
     * 非目录结尾
     * @type {RegExp}
     */
    var REG_PATH_DIR = /\/[^/]+$/;


    /**
     * host
     * @type {RegExp}
     */
    var REG_HOST = /^((ftp|file|https?):)?\/\/[^\/]*/;


    /**
     * 忽略协议
     * @type {RegExp}
     */
    var REG_IGNORE_PROTOCOL = /^\/\//;


    /**
     * 获取路径所在的目录
     * @param path {String} 路径或目录
     * @param [isDir=false] {Boolean} 本身是目录
     * @returns {*}
     */
    var getPathDir = function (path, isDir) {
        path = path.replace(REG_HOST, '');

        if (path === '/') {
            return path;
        }

        return REG_PATH_DIR.test(path) ? (isDir ? path + '/' : path.replace(REG_PATH_DIR, '/')) : path;
    };


    /**
     * 判断是否为绝对路径
     * @type {RegExp}
     */
    var REG_PATH_ABSOLUTE = /^\/|((http|ftp)s?:\/\/)/;


    /**
     * 判断是否相对路径
     * @type {RegExp}
     */
    var REG_PATH_RELATIVE = /^(\.{1,2})\//;


    /**
     * 路径结尾
     * @type {RegExp}
     */
    var REG_PATH_END = /(\/[^/]+?)?\/$/;


    /**
     * 路径合并
     * @param from {String} 标准的起始目录
     * @param to {String} 标准的目标路径
     * @returns {string} 标准的合并路径
     *
     * @example
     * path.j('/', '/');
     * // => '/'
     *
     * path.j('/a/b/c/', '/d/e/f');
     * // => '/d/e/f'
     *
     * path.j('/a/b/c/', './d/e/f');
     * // => '/a/b/c/d/e/f'
     *
     * path.j('/a/b/c/', '../../d/e/f');
     * // => '/a/d/e/f'
     */
    var getPathJoin = function (from, to) {
        if (!to || REG_PATH_ABSOLUTE.test(to)) {
            return to;
        }

        var mathes;

        to = './' + to;

        while ((mathes = to.match(REG_PATH_RELATIVE))) {
            to = to.replace(REG_PATH_RELATIVE, '');

            if (mathes[1].length === 2) {
                from = from.replace(REG_PATH_END, '/');
            }
        }

        return from + to;
    };


    /**
     * 获取标签列表
     * @param tagName {String} 标签名称
     * @param [parent] {Node|HTMLElement} 父节点
     * @returns {NodeList|*}
     */
    var getNodeList = function (tagName, parent) {
        return (parent || doc).getElementsByTagName(tagName);
    };


    /**
     * 文件后缀
     * @type {RegExp}
     */
    var REG_SUFFIX = /[\?#].*?$/;


    /**
     * 脚本后缀
     * @type {RegExp}
     */
    var REG_JS = /\.js($|\?)/i;


    /**
     * 清理 url
     * @param url {String} 原始 URL
     * @param [isSingleURL=false] 是否为独立 URL
     * @returns {String}
     */
    var cleanURL = function (url, isSingleURL) {
        url = url.replace(REG_SUFFIX, '');

        if (isSingleURL) {
            return url;
        }

        if (REG_PATH_END.test(url)) {
            url += 'index';
        }

        return url + (REG_JS.test(url) ? '' : '.js');
    };


    /**
     * 获取 script 的绝对路径
     * @param script
     * @returns {*}
     */
    var getScriptAbsolutelyPath = function (script) {
        return cleanURL(script.hasAttribute ?
            // non-IE6/7
            script.src :
            // @see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
            script.getAttribute('src', 4));
    };


    /**
     * 获取 node 的 dataset 值
     * @param node
     * @param dataKey
     * @returns {string}
     */
    var getNodeDataset = function (node, dataKey) {
        return node.getAttribute('data-' + dataKey);
    };


    /**
     * 是否加载完毕
     * @type {RegExp}
     */
    var REG_LOAD_COMPLETE = /loaded|complete/;


    /**
     * 头部标签
     * @type {HTMLHeadElement|*}
     */
    var $docHead = doc.head || getNodeList('head', doc)[0];


    /**
     * 头部 base 标签
     * @type {HTMLBaseElement|*}
     */
    var $docBase = getNodeList('base', $docHead)[0];


    /**
     * 文件后缀
     * @type {RegExp}
     */
    var REG_EXT = /\.[^.]*$/;


    /**
     * 构造版本 URL
     * @param url
     * @returns {*}
     */
    var buildVersionURL = function (url) {
        if (!coolieConfig._v) {
            return url;
        }

        var version = isString(coolieConfig._v) ? coolieConfig._v : coolieConfig._v[url];

        if (!version) {
            return url;
        }

        return url.replace(REG_EXT, '.' + version + '$&');
    };


    var $lastScript = null;


    /**
     * 加载脚本
     * @param url {String} 脚本 URL
     * @param [isNotModule=false] {Boolean} 是否为模块
     */
    var loadScript = function (url, isNotModule) {
        var url2 = buildVersionURL(url);
        var $script = doc.createElement('script');
        var hasReady = false;
        var onready = function (eve) {
            if (hasReady) {
                return;
            }

            hasReady = true;

            if (eve && eve.type === 'error') {
                throw 'load script error\n' + url2;
            }

            if (isNotModule !== true) {
                $lastScript = $script;
                analyScriptModule($script);
            }

            $docHead.removeChild($script);
            $script = null;
        };

        $script.src = url2;
        $script.id = url;
        $script.async = true;
        $script.defer = true;

        if ($script.onload !== udf) {
            $script.onload = $script.onerror = onready;
        } else {
            $script.onreadystatechange = function (eve) {
                if (REG_LOAD_COMPLETE.test($script.readyState)) {
                    eve = eve || win.event;
                    onready(eve);
                }
            };
        }

        // ref: #185 & http://dev.jquery.com/ticket/2709
        if ($docBase) {
            $docHead.insertBefore($script, $docBase);
        } else {
            $docHead.appendChild($script);
        }
    };


    /**
     * 加载文本模块
     * @param url {String} 文本 URL
     */
    var ajaxText = function (url) {
        var url2 = buildVersionURL(url);
        var xhr = new XMLHttpRequest();
        var hasComplete;
        var onready = function () {
            if (xhr.readyState === 4 && !hasComplete) {
                hasComplete = true;
                if (xhr.status === 200 || xhr.status === 304) {
                    defineModule({
                        _isAn: mainModule._isAn,
                        id: url,
                        url: url2,
                        deps: [],
                        factory: function () {
                            return xhr.responseText;
                        }
                    });
                } else {
                    throw 'ajax error\n' + url2;
                }
            }
        };

        xhr.onload = xhr.onreadystatechange = xhr.onerror = xhr.onabort = xhr.ontimeout = onready;
        xhr.open('GET', url2);
        xhr.send(null);
    };


    /**
     * 包裹图片模块
     * @param id
     */
    var wrapImageModule = function (id) {
        defineModule({
            _isAn: mainModule._isAn,
            id: id,
            url: buildVersionURL(id),
            deps: [],
            factory: function () {
                return id;
            }
        });
    };


    /**
     * 获取当前脚本
     * @returns {*}
     */
    var getCurrentScript = function () {
        var scripts = getNodeList('script');

        return scripts[scripts.length - 1];
    };


    /**
     * 当前运行的脚本
     * @type {Node}
     */
    var currentScript = getCurrentScript();


    /**
     * 获取 URL 的 host
     * @param url
     * @returns {*}
     */
    var getHost = function (url) {
        if (REG_IGNORE_PROTOCOL.test(url)) {
            url = location.protocol + url;
        }

        return (url.match(REG_HOST) || [])[0];
    };


    /**
     * coolie.js 绝对路径
     * @type {String}
     */
    var coolieJSURL = getScriptAbsolutelyPath(currentScript);


    /**
     * coolie.js host
     * @type {String}
     */
    var coolieJSHost = getHost(coolieJSURL);


    /**
     * coolie.js data-config
     * @type {string}
     */
    var coolieJSDataConfig = getNodeDataset(currentScript, 'config');


    /**
     * coolie.js data-main
     * @type {string}
     */
    var coolieJSDataMain = getNodeDataset(currentScript, 'main');


    /**
     * coolie.js 绝对目录
     * @type {String}
     */
    var coolieJSAbsolutelyDir = getPathDir(coolieJSURL);


    /**
     * coolie-config.js 路径
     * @type {string}
     */
    var coolieConfigJSPath = coolieJSDataConfig ? getPathJoin(coolieJSAbsolutelyDir, coolieJSDataConfig) : null;


    /**
     * coolie-config.js 路径
     * @type {string}
     */
    var coolieConfigJSDir = coolieJSDataConfig ? getPathDir(coolieConfigJSPath) : null;


    /**
     * coolie-config.js URL
     * @type {string}
     */
    var coolieConfigJSURL = coolieJSDataConfig ? getPathJoin(coolieJSHost, coolieConfigJSPath) : null;


    /**
     * coolie-config.js host
     * @type {String}
     */
    var coolieConfigJSHost = (function () {
        if (!coolieJSDataConfig) {
            return null;
        }

        var host = getHost(coolieConfigJSURL);

        if (host) {
            return host;
        }

        host = coolieJSHost;
        coolieConfigJSURL = host + coolieConfigJSURL;

        return host;
    }());


    /**
     * 入口模块的基准路径
     * @type {String}
     */
    var mainModuleBaseDir = coolieConfigJSDir;


    /**
     * 入口模块
     * @type {Object}
     */
    var mainModule = {};


    /**
     * coolie
     * @type {Object}
     */
    var coolie = {};


    /**
     * coolie 版本号
     * @type {string}
     */
    coolie.version = version;
    /**
     * 是否已经执行了入口模块
     * @type {boolean}
     */
    var hasExecuteMain = false;


    /**
     * 依赖的模块
     * @type {{}}
     */
    var dependenceModules = {};


    /**
     * 定义模块数组
     * @type {Array}
     */
    var defineList = [];


    /**
     * 模块
     * @type {{}}
     */
    var modules = {};


    /**
     * 依赖长度，包括入口模块
     * @type {number}
     */
    var dependenceLength = 1;


    /**
     * 注册长度，包括入口模块
     * @type {number}
     */
    var defineLength = 0;


    /**
     * coolie 配置
     * @param config
     */
    coolie.config = function (config) {
        var currentScript = getCurrentScript();
        var coolieConfigJSURL = getScriptAbsolutelyPath(currentScript);

        // 单独的 coolie-config.js
        if (coolieJSURL !== coolieConfigJSURL) {
            mainModuleBaseDir = coolieConfigJSDir = getPathDir(coolieConfigJSURL);
            coolieConfigJSHost = getHost(coolieConfigJSURL);
        }

        coolieConfig = config;
        mainModuleBaseDir = getPathJoin(coolieConfigJSDir, getPathDir(coolieConfig.base, true));
        coolieConfig.version = coolieConfig.version || {};

        if (isString(coolieConfig.version)) {
            coolieConfig._v = coolieConfig.version;
        } else {
            coolieConfig._v = {};
            each(coolieConfig.version, function (path, version) {
                coolieConfig._v[coolieConfigJSHost + getPathJoin(mainModuleBaseDir, path)] = version;
            });
        }

        if (coolieJSDataMain) {
            var mainModuleId = mainModule.url = cleanURL(coolieConfigJSHost + getPathJoin(mainModuleBaseDir, coolieJSDataMain));

            mainModule._defined = false;
            dependenceModules[mainModuleId] = mainModule;
        }

        config.debug = config.debug !== false;

        return coolie;
    };


    /**
     * 开始执行入口模块
     * @param [main] 手动指定入口模块地址
     * @returns {Object}
     */
    coolie.use = function (main) {
        if (hasExecuteMain) {
            return coolie;
        }

        hasExecuteMain = true;
        timeNow = now();

        if (main) {
            mainModule.url = coolieConfigJSHost + getPathJoin(mainModuleBaseDir, main);
            dependenceModules[mainModule.url] = mainModule;
        }

        if (!mainModule.url) {
            return coolie;
        }

        loadScript(mainModule.url);

        console.group('coolie modules');

        return coolie;
    };


    /**
     * 添加模块加载器回调
     * @param callback
     */
    coolie.callback = function (callback) {
        if (mainModule._executed && isFunction(callback)) {
            callback.call(coolie, mainModule.exports);

            return coolie;
        }

        if (isFunction(callback)) {
            coolieCallbacks.push(callback);
        }

        return coolie;
    };


    /**
     * require 正则
     * @type {RegExp}
     * @link https://github.com/seajs/seajs/blob/master/dist/sea-debug.js
     */
    var REG_REQUIRE = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^\/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*require|(?:^|[^$])\brequire\s*\(\s*(["'])(.+?)\1\s*\)/g;


    /**
     * 反斜杠
     * @type {RegExp}
     */
    var REG_SLASH = /\\\\/g;


    /**
     * require 类型
     * @type {RegExp}
     */
    var REG_REQUIRE_TYPE = /([^"']+)(?:['"]\s*?,\s*?['"]([^'"]*))?/;


    /**
     * 解析依赖类型
     * @param name
     * @returns {Object}
     */
    var parseNameType = function (name) {
        if (REG_TEXT_MODULE.test(name)) {
            return {
                name: cleanURL(name.replace(REG_TEXT_MODULE, ''), true),
                type: 'text'
            };
        } else if (REG_IMAGE_MODULE.test(name)) {
            return {
                name: cleanURL(name.replace(REG_IMAGE_MODULE, ''), true),
                type: 'image'
            };
        }

        return {
            name: cleanURL(name),
            type: 'js'
        };
    };


    /**
     * 模块类型别名
     * @type {{image: string, text: string, html: string, css: string}}
     */
    var moduleTypeMap = {
        image: 'image',
        text: 'text',
        html: 'text',
        css: 'text'
    };


    /**
     * 解析代码里的依赖信息
     * @param code {String} 代码
     */
    var parseDependencies = function (code) {
        var requires = [];

        code.replace(REG_SLASH, '').replace(REG_REQUIRE, function ($0, $1, $2) {
            if ($2) {
                var matches = $2.match(REG_REQUIRE_TYPE);
                var dep;

                // require('abc', 'image');
                if (matches[2]) {
                    dep = {
                        name: cleanURL(matches[1], true),
                        type: moduleTypeMap[matches[2].toLowerCase()]
                    };
                }
                // require('abc');
                else {
                    dep = parseNameType(matches[1]);
                }

                requires.push(dep);
            }
        });

        return requires;
    };


    /**
     * 文本模块
     * @type {RegExp}
     */
    var REG_TEXT_MODULE = /^(css|html|text)!/i;


    /**
     * 图片模块
     * @type {RegExp}
     */
    var REG_IMAGE_MODULE = /^(image)!/i;


    /**
     * 分析脚本模块
     * @param $interactiveScript {Object} 当前活动的脚本
     */
    var analyScriptModule = function ($interactiveScript) {
        var isAn = true;
        var args = defineList.shift();
        var id = args[0];
        var deps = args[1];
        var factory = args[2];
        var interactiveScriptId = $interactiveScript.id;
        var interactiveScriptURL = getScriptAbsolutelyPath($interactiveScript);
        var interactiveScriptPath = getPathDir(interactiveScriptId);

        // define(id, deps, factory);
        if (isFunction(args[2])) {
            isAn = false;
        }
        // define(id, factory);
        else if (isFunction(args[1])) {
            id = null;
            deps = [];
            factory = args[1];
        }
        // define(factory);
        else if (isFunction(args[0])) {
            factory = args[0];
            deps = parseDependencies(factory.toString());
            id = null;
        }

        id = mainModule._defined && mainModule._isAn ? interactiveScriptId : id || interactiveScriptId;

        var module = {
            _isAn: isAn,
            _path: interactiveScriptPath,
            _node: $interactiveScript,
            id: id,
            url: interactiveScriptURL,
            deps: deps,
            factory: factory
        };

        if (!mainModule.id) {
            // 具名模块
            if (!isAn) {
                dependenceModules[id] = dependenceModules[mainModule.url];
            }

            module._isMain = true;
            mainModule = module;
            mainModule._defined = true;
        }

        var deps2 = [];

        each(deps, function (index, dep) {
            // ['1', '2']
            if (isString(dep)) {
                dep = {
                    id: dep
                };
            }

            if (mainModule._isAn) {
                var path = getPathJoin(interactiveScriptPath, dep.name);

                dep.id = cleanURL(coolieConfigJSHost + path, dep.type !== 'js');
            }

            if (id === dep.id) {
                throw 'required myself: \n' + id;
            }

            if (modules[dep.id]) {
                each(modules[dep.id].deps, function (index, dep) {
                    if (dep === id) {
                        throw 'required circle: \n' + dep + '\n' + id;
                    }
                });
            }

            if (!dependenceModules[dep.id]) {
                deps2.push(dep.id);
                dependenceModules[dep.id] = true;
                dependenceLength++;

                if (mainModule._isAn) {
                    switch (dep.type) {
                        case 'text':
                            ajaxText(dep.id);
                            break;

                        case 'image':
                            wrapImageModule(dep.id);
                            break;

                        default :
                            loadScript(dep.id);
                    }
                }
            }
        });

        module.deps = deps2;
        defineModule(module);

        if (defineList.length) {
            analyScriptModule($lastScript);
        }
    };


    /**
     * 定义 module
     * @param module
     * @returns module
     */
    var defineModule = function (module) {
        module.exports = {};
        module._execute = (function () {
            var require = function (id, type) {
                var dep;

                if (mainModule._isAn) {
                    if (type) {
                        dep = {
                            name: id,
                            type: type
                        };
                    } else {
                        dep = parseNameType(id);
                    }

                    id = coolieConfigJSHost + cleanURL(getPathJoin(module._path, dep.name), dep.type !== 'js');
                }

                if (!modules[id]) {
                    throw 'can not found module \n' + id + '\nbut required in\n' + module.id;
                }

                return modules[id]._execute();
            };

            return function () {
                var id = module.id;

                if (module._executed) {
                    return modules[id].exports;
                } else {
                    module._executed = true;
                    modules[id].exports = module.factory.call(window, require, module.exports, module) || module.exports;

                    return modules[id].exports;
                }
            };
        })();
        modules[module.id] = module;
        defineLength++;
        console.log('module ' + module.id);

        if (!defineList.length && defineLength === dependenceLength) {
            console.log('past ' + ( now() - timeNow) + 'ms');
            console.groupEnd('coolie modules');
            mainModule._execute();
            each(coolieCallbacks, function (index, callback) {
                callback.call(coolie, mainModule.exports);
            });
        }
    };


    /**
     * 定义一个模块
     * @param {String} [id] 模块id
     * @param {Array} [deps] 模块依赖
     * @param {Function} factory 模块方法
     */
    var define = function (id, deps, factory) {
        defineList.push([id, deps, factory]);
    };


    // 加载配置脚本
    if (coolieJSDataConfig) {
        loadScript(coolieConfigJSURL, true);
    }


    /**
     * @namespace coolie
     * @type {Object}
     */
    window.coolie = coolie;
    window.coolie.modules = modules;
    window.coolie.configs = coolieConfig;
    window.coolie.each = each;

    /**
     * @namespace define
     * @type {define}
     */
    window.define = define;
    window.define.amd = {};
    window.define.cmd = {};
})();
