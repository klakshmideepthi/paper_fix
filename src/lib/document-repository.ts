// lib/document-repository.ts
import { supabase, Document } from './supabase';

export const DocumentRepository = {
  // Create a new document
  async createDocument(
    userId: string,
    title: string,
    content: string,
    templateId: string,
    answers: Record<string, string>
  ): Promise<Document | null> {
    const { data, error } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        title,
        content,
        template_id: templateId,
        template_answers: answers,
        is_draft: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating document:', error);
      return null;
    }

    return data as Document;
  },

  // Create a temporary draft document
  async createDraftDocument(
    userId: string,
    title: string,
    content: string,
    templateId: string,
    answers: Record<string, string>
  ): Promise<Document | null> {
    // First check if a draft already exists for this template
    const existingDrafts = await this.getDraftsByTemplateId(userId, templateId);
    
    if (existingDrafts.length > 0) {
      // Update the existing draft instead of creating a new one
      const existingDraft = existingDrafts[0];
      const { data, error } = await supabase
        .from('documents')
        .update({
          title,
          content,
          template_answers: answers,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingDraft.id)
        .select('*')
        .single();
        
      if (error) {
        console.error('Error updating existing draft:', error);
        return null;
      }
      
      return data as Document;
    }
    
    // Create a new draft if none exists
    const { data, error } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        title,
        content,
        template_id: templateId,
        template_answers: answers,
        is_draft: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating draft document:', error);
      return null;
    }

    return data as Document;
  },

  // Save a document as a user works on it (auto-save)
  async saveDocumentProgress(
    documentId: string,
    content: string,
    title?: string
  ): Promise<boolean> {
    interface DocumentUpdate {
      content: string;
      updated_at: string;
      title?: string;
    }
  
    const updates: DocumentUpdate = {
      content,
      updated_at: new Date().toISOString(),
    };
  
    if (title) {
      updates.title = title;
    }

    const { error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', documentId);

    if (error) {
      console.error('Error saving document progress:', error);
      return false;
    }

    return true;
  },

  // Get drafts by template ID for a specific user
  async getDraftsByTemplateId(userId: string, templateId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .eq('template_id', templateId)
      .eq('is_draft', true)
      .order('updated_at', { ascending: false }); // Get the most recent first

    if (error) {
      console.error('Error fetching template drafts:', error);
      return [];
    }

    return data as Document[];
  },

  // Convert a draft to a finalized document
  async finalizeDraftDocument(
    documentId: string,
    title?: string
  ): Promise<Document | null> {
    const updates: any = {
      is_draft: false,
      updated_at: new Date().toISOString(),
    };

    if (title) {
      updates.title = title;
    }

    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', documentId)
      .select('*')
      .single();

    if (error) {
      console.error('Error finalizing draft document:', error);
      return null;
    }

    return data as Document;
  },

  // Get all documents for a user
  async getDocumentsByUser(userId: string, includeDrafts: boolean = false): Promise<Document[]> {
    let query = supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId);
    
    if (!includeDrafts) {
      query = query.eq('is_draft', false);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return [];
    }

    return data as Document[];
  },

  // Get user's draft documents
  async getDraftDocuments(userId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .eq('is_draft', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching draft documents:', error);
      return [];
    }

    return data as Document[];
  },

  // Get a single document by ID
  async getDocument(id: string): Promise<Document | null> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching document:', error);
      return null;
    }

    return data as Document;
  },

  // Update a document
  async updateDocument(id: string, updates: Partial<Document>): Promise<Document | null> {
    // Add updated timestamp if not already provided
    const updatedDocument: Partial<Document> = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('documents')
      .update(updatedDocument)
      .eq('id', id)
      .select('*')
      .single();
  
    if (error) {
      console.error('Error updating document:', error);
      return null;
    }
  
    return data as Document;
  },

  // Delete a document and all its related drafts
  async deleteDocument(id: string): Promise<boolean> {
    try {
      // First, get the document to check if it's a draft
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('user_id, template_id, is_draft')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching document for deletion:', fetchError);
        return false;
      }
      
      if (document) {
        // If it's a regular document, also delete all associated drafts
        if (!document.is_draft) {
          // Delete all drafts with the same user_id and template_id
          const { error: draftDeleteError } = await supabase
            .from('documents')
            .delete()
            .match({ 
              user_id: document.user_id, 
              template_id: document.template_id,
              is_draft: true 
            });
          
          if (draftDeleteError) {
            console.error('Error deleting associated drafts:', draftDeleteError);
            // Continue to delete the main document even if draft deletion fails
          }
        }
        
        // Delete the specified document
        const { error: deleteError } = await supabase
          .from('documents')
          .delete()
          .eq('id', id);
        
        if (deleteError) {
          console.error('Error deleting document:', deleteError);
          return false;
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Unexpected error deleting document:', error);
      return false;
    }
  }
};