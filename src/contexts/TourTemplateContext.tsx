import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthProvider';
import { useToast } from '@chakra-ui/react';
import { TourTemplate, TourTemplateData } from '../lib/types';

interface TourTemplateContextType {
  templates: TourTemplate[];
  userTemplates: TourTemplate[];
  systemTemplates: TourTemplate[];
  isLoading: boolean;
  error: string | null;
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (_category: string) => void;
  refreshTemplates: () => Promise<void>;
  createTemplate: (_templateData: Partial<TourTemplate>) => Promise<boolean>;
  updateTemplate: (_templateId: string, _templateData: Partial<TourTemplate>) => Promise<boolean>;
  deleteTemplate: (_templateId: string) => Promise<boolean>;
  useTemplate: (_templateId: string) => Promise<TourTemplateData | null>;
  saveAsTemplate: (_name: string, _description: string, _tourData: TourTemplateData, _category?: string) => Promise<boolean>;
}

const TourTemplateContext = createContext<TourTemplateContextType | undefined>(undefined);

export const TourTemplateProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<TourTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const toast = useToast();

  // Computed values
  const systemTemplates = templates.filter(t => t.is_system_template);
  const userTemplates = templates.filter(t => !t.is_system_template && t.creator_id === user?.id);
  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];

  const refreshTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('tour_templates')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false });

      // If user is logged in, include their templates
      if (user) {
        query = query.or(`is_system_template.eq.true,creator_id.eq.${user.id}`);
      } else {
        query = query.eq('is_system_template', true);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.warn('Unable to fetch tour templates:', fetchError.message);
        setTemplates([]);
        return;
      }

      setTemplates(data || []);
    } catch (err: any) {
      console.warn('Error fetching tour templates:', err);
      setError(err.message || 'Failed to load templates');
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createTemplate = async (templateData: Partial<TourTemplate>): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to create templates',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('tour_templates')
        .insert({
          ...templateData,
          creator_id: user.id,
          is_system_template: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.warn('Unable to create template:', error.message);
        return false;
      }

      toast({
        title: 'Template created',
        description: 'Your tour template has been saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      await refreshTemplates();
      return true;
    } catch (err) {
      console.warn('Error creating template:', err);
      return false;
    }
  };

  const updateTemplate = async (templateId: string, templateData: Partial<TourTemplate>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('tour_templates')
        .update({
          ...templateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', templateId)
        .eq('creator_id', user.id); // Security check

      if (error) {
        console.warn('Unable to update template:', error.message);
        return false;
      }

      toast({
        title: 'Template updated',
        description: 'Your template has been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      await refreshTemplates();
      return true;
    } catch (err) {
      console.warn('Error updating template:', err);
      return false;
    }
  };

  const deleteTemplate = async (templateId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('tour_templates')
        .delete()
        .eq('id', templateId)
        .eq('creator_id', user.id); // Security check

      if (error) {
        console.warn('Unable to delete template:', error.message);
        return false;
      }

      toast({
        title: 'Template deleted',
        description: 'Your template has been removed',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      await refreshTemplates();
      return true;
    } catch (err) {
      console.warn('Error deleting template:', err);
      return false;
    }
  };

  const useTemplate = async (templateId: string): Promise<TourTemplateData | null> => {
    try {
      // Increment usage count (simple increment without raw SQL)
      const { data: currentTemplate } = await supabase
        .from('tour_templates')
        .select('usage_count')
        .eq('id', templateId)
        .single();
        
      if (currentTemplate) {
        await supabase
          .from('tour_templates')
          .update({ 
            usage_count: (currentTemplate.usage_count || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', templateId);
      }

      // Get template data
      const template = templates.find(t => t.id === templateId);
      if (!template) {
        console.warn('Template not found:', templateId);
        return null;
      }

      return template.template_data;
    } catch (err) {
      console.warn('Error using template:', err);
      return null;
    }
  };

  const saveAsTemplate = async (
    name: string, 
    description: string, 
    tourData: TourTemplateData,
    category: string = 'general'
  ): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to save templates',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('tour_templates')
        .insert({
          name,
          description,
          template_data: tourData,
          creator_id: user.id,
          category,
          is_system_template: false,
          is_active: true,
          usage_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.warn('Unable to save template:', error.message);
        toast({
          title: 'Error saving template',
          description: 'Could not save your template. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return false;
      }

      toast({
        title: 'Template saved',
        description: 'Your tour has been saved as a template for future use',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      await refreshTemplates();
      return true;
    } catch (err) {
      console.warn('Error saving template:', err);
      return false;
    }
  };

  // Load templates on mount
  useEffect(() => {
    refreshTemplates();
  }, [user]);

  const value = {
    templates,
    userTemplates,
    systemTemplates,
    isLoading,
    error,
    categories,
    selectedCategory,
    setSelectedCategory,
    refreshTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    useTemplate,
    saveAsTemplate,
  };

  return <TourTemplateContext.Provider value={value}>{children}</TourTemplateContext.Provider>;
};

export const useTourTemplates = () => {
  const context = useContext(TourTemplateContext);
  if (context === undefined) {
    throw new Error('useTourTemplates must be used within a TourTemplateProvider');
  }
  return context;
};