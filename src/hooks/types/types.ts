type NodeType = 'link' | 'note' | 'idea';

export interface NodeDb {
    id: string;
    title: string;
    type: NodeType;
    tags: string[];
    content: string;
    full_data: NodeOnAdd;
    user_id: string | null;
    group_id: string | null;
    url: string;
    is_ai_processed: boolean;
}

export type NodeOnAdd = Omit<NodeDb, 'id' | 'fullData' | 'userId' | 'group_id' | 'is_ai_processed' | 'user_id'>;

export interface LinkDb {
    id: string;
    source: string;
    target: string;
    relation_type: string;
    label: string;
    weight: number;
    user_id: string | null;
}
