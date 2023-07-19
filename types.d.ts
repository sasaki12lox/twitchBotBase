interface Methods {
    [key: string]: Function;
}

type Variables<T> = {
[K in keyof T]: T[K] extends "s" ? string :
                T[K] extends "n" ? number :
                T[K] extends "s." ? string[] :
                T[K] extends "n." ? number[] :
                never
};

interface SharedMethods {
    [moduleName: string] : {[methodName: string]: Function}
}

interface ModuleBase<M extends Methods, D, T extends SharedMethods> {
    name: string
    description?: string
    prepared?: (
        sharedContext: {[moduleName: string]: any},
        moduleMethods: T,
        client: import('tmi.js').Client
    ) => any
    dependencies?: string[]
    methods?: M
    variables?: Variables<D>
}

interface MessageBehavorModule<T extends SharedMethods> {
    messageBehavor: 'active',
    messageBehavorCallback: (
        channel: string,
        tags: import('tmi.js').ChatUserstate,
        msg: string,
        self: boolean,
        client: import('tmi.js').Client,
        sharedContext: {[moduleName: string]: any},
        moduleMethods: T
    ) => any
}

export type Module<M extends Methods, T extends SharedMethods, D> = ModuleBase<M, D, T> | (ModuleBase<M, D, T> & MessageBehavorModule<T>)