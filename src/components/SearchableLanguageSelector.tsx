import { useMemo } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  useColorModeValue,
} from '@chakra-ui/react';
import Select, { StylesConfig } from 'react-select';

export interface LanguageOption {
  value: string;
  label: string;
  code: string;
}

interface SearchableLanguageSelectorProps {
  selectedLanguages: string[];
  onChange: (_languages: string[]) => void;
  isRequired?: boolean;
  isInvalid?: boolean;
  errorMessage?: string;
  helperText?: string;
  label?: string;
  placeholder?: string;
  isDisabled?: boolean;
}

// Comprehensive language list with codes
const AVAILABLE_LANGUAGES: LanguageOption[] = [
  { value: 'english', label: 'English', code: 'en' },
  { value: 'spanish', label: 'Spanish', code: 'es' },
  { value: 'french', label: 'French', code: 'fr' },
  { value: 'german', label: 'German', code: 'de' },
  { value: 'italian', label: 'Italian', code: 'it' },
  { value: 'portuguese', label: 'Portuguese', code: 'pt' },
  { value: 'russian', label: 'Russian', code: 'ru' },
  { value: 'chinese', label: 'Chinese (Mandarin)', code: 'zh' },
  { value: 'japanese', label: 'Japanese', code: 'ja' },
  { value: 'korean', label: 'Korean', code: 'ko' },
  { value: 'arabic', label: 'Arabic', code: 'ar' },
  { value: 'hindi', label: 'Hindi', code: 'hi' },
  { value: 'georgian', label: 'Georgian', code: 'ka' },
  { value: 'turkish', label: 'Turkish', code: 'tr' },
  { value: 'dutch', label: 'Dutch', code: 'nl' },
  { value: 'swedish', label: 'Swedish', code: 'sv' },
  { value: 'norwegian', label: 'Norwegian', code: 'no' },
  { value: 'danish', label: 'Danish', code: 'da' },
  { value: 'polish', label: 'Polish', code: 'pl' },
  { value: 'czech', label: 'Czech', code: 'cs' },
  { value: 'hungarian', label: 'Hungarian', code: 'hu' },
  { value: 'romanian', label: 'Romanian', code: 'ro' },
  { value: 'greek', label: 'Greek', code: 'el' },
  { value: 'hebrew', label: 'Hebrew', code: 'he' },
  { value: 'finnish', label: 'Finnish', code: 'fi' },
  { value: 'bulgarian', label: 'Bulgarian', code: 'bg' },
  { value: 'croatian', label: 'Croatian', code: 'hr' },
  { value: 'serbian', label: 'Serbian', code: 'sr' },
  { value: 'ukrainian', label: 'Ukrainian', code: 'uk' },
  { value: 'lithuanian', label: 'Lithuanian', code: 'lt' },
  { value: 'latvian', label: 'Latvian', code: 'lv' },
  { value: 'estonian', label: 'Estonian', code: 'et' },
  { value: 'armenian', label: 'Armenian', code: 'hy' },
  { value: 'azerbaijani', label: 'Azerbaijani', code: 'az' },
  { value: 'thai', label: 'Thai', code: 'th' },
  { value: 'vietnamese', label: 'Vietnamese', code: 'vi' },
  { value: 'indonesian', label: 'Indonesian', code: 'id' },
  { value: 'malay', label: 'Malay', code: 'ms' },
  { value: 'filipino', label: 'Filipino', code: 'fil' },
  { value: 'urdu', label: 'Urdu', code: 'ur' },
  { value: 'bengali', label: 'Bengali', code: 'bn' },
  { value: 'tamil', label: 'Tamil', code: 'ta' },
  { value: 'telugu', label: 'Telugu', code: 'te' },
  { value: 'marathi', label: 'Marathi', code: 'mr' },
  { value: 'gujarati', label: 'Gujarati', code: 'gu' },
  { value: 'punjabi', label: 'Punjabi', code: 'pa' },
  { value: 'persian', label: 'Persian (Farsi)', code: 'fa' },
  { value: 'swahili', label: 'Swahili', code: 'sw' },
  { value: 'amharic', label: 'Amharic', code: 'am' },
  { value: 'yoruba', label: 'Yoruba', code: 'yo' },
  { value: 'igbo', label: 'Igbo', code: 'ig' },
  { value: 'hausa', label: 'Hausa', code: 'ha' }
];

const SearchableLanguageSelector = ({
  selectedLanguages,
  onChange,
  isRequired = false,
  isInvalid = false,
  errorMessage,
  helperText,
  label = 'Languages',
  placeholder = 'Search and select languages...',
  isDisabled = false,
}: SearchableLanguageSelectorProps) => {
  const selectBorderColor = useColorModeValue('gray.200', 'whiteAlpha.300');
  const selectBackgroundColor = useColorModeValue('white', 'primary.600');
  const selectTextColor = useColorModeValue('gray.800', 'highlight.50');
  const errorColor = useColorModeValue('#E53E3E', '#FC8181');

  // Convert selectedLanguages to options
  const selectedOptions = useMemo(() => {
    return selectedLanguages
      .map(lang => AVAILABLE_LANGUAGES.find(option => 
        option.value === lang.toLowerCase() || option.label.toLowerCase() === lang.toLowerCase()
      ))
      .filter(Boolean) as LanguageOption[];
  }, [selectedLanguages]);

  const handleChange = (newOptions: readonly LanguageOption[] | null) => {
    const languages = newOptions ? newOptions.map(option => option.label) : [];
    onChange(languages);
  };

  // Custom styles for react-select to match Chakra UI theme
  // Using CSS variables for dynamic theming
  const selectStyles: StylesConfig<LanguageOption, true> = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: selectBackgroundColor,
      borderColor: isInvalid ? errorColor : (state.isFocused ? 'var(--color-secondary)' : selectBorderColor),
      borderWidth: '1px',
      borderRadius: '6px',
      boxShadow: state.isFocused ? `0 0 0 1px var(--color-secondary)` : 'none',
      '&:hover': {
        borderColor: isInvalid ? errorColor : 'var(--color-secondary)',
      },
      minHeight: '40px',
      fontSize: '16px',
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: 'var(--chakra-colors-secondary-50)',
      borderRadius: '6px',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: 'var(--color-secondary)',
      fontSize: '14px',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: 'var(--color-secondary)',
      '&:hover': {
        backgroundColor: 'var(--chakra-colors-secondary-100)',
        color: 'var(--chakra-colors-secondary-700)',
      },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? 'var(--color-secondary)' : (state.isFocused ? 'var(--chakra-colors-secondary-50)' : selectBackgroundColor),
      color: state.isSelected ? 'var(--color-highlight)' : selectTextColor,
      '&:hover': {
        backgroundColor: state.isSelected ? 'var(--color-secondary)' : 'var(--chakra-colors-secondary-50)',
        color: state.isSelected ? 'var(--color-highlight)' : 'var(--color-secondary)',
      },
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: selectBackgroundColor,
      border: `1px solid ${selectBorderColor}`,
      borderRadius: '6px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: useColorModeValue('#A0AEC0', 'var(--chakra-colors-whiteAlpha-500)'),
    }),
    input: (provided) => ({
      ...provided,
      color: selectTextColor,
    }),
    singleValue: (provided) => ({
      ...provided,
      color: selectTextColor,
    }),
  };

  return (
    <FormControl isRequired={isRequired} isInvalid={isInvalid}>
      {label && <FormLabel>{label}</FormLabel>}
      
      <Box>
        <Select
          isMulti
          options={AVAILABLE_LANGUAGES}
          value={selectedOptions}
          onChange={handleChange}
          placeholder={placeholder}
          isSearchable
          isClearable
          isDisabled={isDisabled}
          styles={selectStyles}
          closeMenuOnSelect={false}
          hideSelectedOptions={false}
          getOptionLabel={(option) => option.label}
          getOptionValue={(option) => option.value}
          noOptionsMessage={() => 'No languages found'}
          loadingMessage={() => 'Loading languages...'}
        />
      </Box>
      
      {errorMessage && <FormErrorMessage>{errorMessage}</FormErrorMessage>}
      {helperText && !isInvalid && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default SearchableLanguageSelector;