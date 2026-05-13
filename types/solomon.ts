/**
 * 모두의 솔로몬 — 도메인 타입 정의
 * supabase/schema.sql 과 1:1 매핑
 */

// ============================================================================
// Core entities
// ============================================================================

export interface User {
  id: string;
  nickname: string;
  avatar_url: string | null;
  total_votes: number;
  majority_matched_votes: number;
  created_at: string;
}

export type PostStatus = "active" | "closed";

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  expires_at: string; // created_at + 24h
  status: PostStatus;
}

export interface Option {
  id: string;
  post_id: string;
  option_text: string;
  option_order: number;
  created_at: string;
  /**
   * ★ 블라인드 룰: expires_at 이전에는 절대 노출되어선 안 됨.
   *   서버에서 분기 제공.
   */
  vote_count?: number;
}

export interface Vote {
  id: string;
  post_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}

// ============================================================================
// Composite views
// ============================================================================

/** 게시글 + 선택지(작성자 포함) — 피드/상세 공통 */
export interface PostWithOptions extends Post {
  options: Option[];
  author?: Pick<User, "id" | "nickname" | "avatar_url">;
  /** 현재 사용자가 이 게시글에 투표했는지 (서버에서 계산) */
  my_vote?: { option_id: string } | null;
}

/** 결과 공개 후 UI에서 사용 — get_post_results() RPC 결과와 호환 */
export interface PostResult {
  option_id: string;
  option_text: string;
  option_order: number;
  vote_count: number;
  is_winner: boolean;
}

/** 솔로몬 지수 — get_user_solomon_index() RPC 결과 */
export interface SolomonIndex {
  user_id: string;
  total_votes: number;
  matched: number;
  /** 0 ~ 100 */
  index: number;
  title: string;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * 게시글이 만료(블라인드 해제)되었는지 판정.
 * status 가 'closed' 거나 expires_at 시점이 지났으면 true.
 */
export function isExpired(
  post: Pick<Post, "expires_at" | "status">,
  now: Date = new Date(),
): boolean {
  if (post.status === "closed") return true;
  return new Date(post.expires_at).getTime() <= now.getTime();
}

/**
 * 종료까지 남은 밀리초. 이미 만료라면 0.
 */
export function remainingMs(
  post: Pick<Post, "expires_at" | "status">,
  now: Date = new Date(),
): number {
  if (post.status === "closed") return 0;
  const diff = new Date(post.expires_at).getTime() - now.getTime();
  return diff > 0 ? diff : 0;
}

/**
 * 솔로몬 지수 → 칭호 문자열.
 * total_votes === 0 인 경우 별도 칭호로 분기하고 싶다면 호출 측에서 처리.
 */
export function getTitleByIndex(index: number): string {
  if (index >= 90) return "👑 진정한 솔로몬";
  if (index >= 70) return "⚖️ 현명한 판단자";
  if (index >= 50) return "🤔 고민하는 시민";
  if (index >= 30) return "🌊 역류하는 물고기";
  return "🎸 마이웨이 힙스터";
}

/**
 * 솔로몬 지수 계산.
 * total_votes 가 0 이면 0 반환.
 */
export function calcSolomonIndex(
  user: Pick<User, "total_votes" | "majority_matched_votes">,
): number {
  if (user.total_votes <= 0) return 0;
  return Math.round((user.majority_matched_votes / user.total_votes) * 1000) / 10;
}

// ============================================================================
// Supabase Database type (간이 매핑 — 클라이언트 타입 추론용)
// ============================================================================

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          nickname: string;
          avatar_url: string | null;
          total_votes: number;
          majority_matched_votes: number;
          created_at: string;
        };
        Insert: {
          id: string;
          nickname: string;
          avatar_url?: string | null;
          total_votes?: number;
          majority_matched_votes?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          nickname?: string;
          avatar_url?: string | null;
          total_votes?: number;
          majority_matched_votes?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          image_url: string | null;
          created_at: string;
          expires_at: string;
          status: PostStatus;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          image_url?: string | null;
          created_at?: string;
          expires_at?: string;
          status?: PostStatus;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          image_url?: string | null;
          created_at?: string;
          expires_at?: string;
          status?: PostStatus;
        };
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      options: {
        Row: {
          id: string;
          post_id: string;
          option_text: string;
          option_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          option_text: string;
          option_order: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          option_text?: string;
          option_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "options_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      votes: {
        Row: {
          id: string;
          post_id: string;
          option_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          option_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          option_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "votes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_option_id_fkey";
            columns: ["option_id"];
            isOneToOne: false;
            referencedRelation: "options";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          id: string;
          post_id: string;
          reporter_id: string;
          reason: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          reporter_id: string;
          reason: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          reporter_id?: string;
          reason?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_post_results: {
        Args: { p_post_id: string };
        Returns: PostResult[];
      };
      get_user_solomon_index: {
        Args: { p_user_id: string };
        Returns: Array<{
          user_id: string;
          total_votes: number;
          matched: number;
          ratio: number;
          title: string;
        }>;
      };
      close_expired_posts: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
