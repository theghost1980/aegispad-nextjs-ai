"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Importar Select
import {
  HIVELENS_API_ENDPOINT_DEV,
  HIVELENS_API_ENDPOINT_PROD,
} from "@/constants/constants";
import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";
import NextImage from "next/image"; // Importar el componente Image de Next.js
import React, { FormEvent, useCallback, useState } from "react";

type SearchType = "general" | "user" | "tags";

// Definición del tipo para una imagen individual (ajustada para Hivelens API)
interface HivelensImageType {
  id: string;
  imageUrl: string;
  author?: string;
  timestamp?: string;
  totalCount?: number;
  currentPage?: number;
  title?: string;
  postUrl?: string;
  tags?: string[];
}

// Tipo interno que usará el componente
interface ImageType {
  id: string;
  thumbnailUrl: string;
  fullUrl: string;
  alt?: string;
  postUrl?: string; // Añadir postUrl
  // Podrías añadir más campos de HivelensImageType si necesitas mostrarlos
}

// Tipo para los datos de la imagen seleccionada que se pasarán al callback
interface SelectedImageData {
  imageUrl: string;
  postUrl?: string;
  altText?: string;
}
// Props del componente
interface ImageSearchAndInsertProps {
  onInsertImages: (images: SelectedImageData[]) => void; // Actualizar tipo de prop
  mode?: "inline" | "modal";
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  maxSelectable?: number;
  placeholderText?: string;
  insertButtonText?: string;
  searchButtonText?: string;
  noResultsText?: string;
  errorText?: string;
  loadingText?: string;
  modalTitle?: string;
  apiExtraParams?: Record<string, string | number | boolean>;
}

export function ImageSearchAndInsert({
  onInsertImages,
  mode = "inline",
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
  maxSelectable = 1,
  placeholderText = "Buscar imágenes en Hivelens...",
  insertButtonText = "Insertar seleccionadas",
  searchButtonText = "Buscar",
  noResultsText = "No se encontraron imágenes.",
  errorText = "Error al buscar imágenes. Inténtalo de nuevo.",
  loadingText = "Buscando...",
  modalTitle = "Buscar y Agregar Imágenes de Hivelens",
  apiExtraParams = {},
}: ImageSearchAndInsertProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<ImageType[]>([]);
  const [selectedImages, setSelectedImages] = useState<SelectedImageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const [searchType, setSearchType] = useState<SearchType>("general");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentLimit, setCurrentLimit] = useState<number>(20);

  const apiEndpoint =
    process.env.NODE_ENV === "development"
      ? HIVELENS_API_ENDPOINT_DEV
      : HIVELENS_API_ENDPOINT_PROD;

  const isModalControlled =
    controlledIsOpen !== undefined && controlledOnOpenChange !== undefined;
  const currentModalOpen = isModalControlled
    ? controlledIsOpen
    : internalModalOpen;

  const handleModalOpenChange = (open: boolean) => {
    if (isModalControlled) {
      controlledOnOpenChange?.(open);
    } else {
      setInternalModalOpen(open);
    }
    if (!open) {
      setSearchTerm("");
      setSearchResults([]);
      setSelectedImages([]);
      setSearchType("general");
      setError(null);
      setCurrentLimit(20);
      setCurrentPage(1);
      setTotalPages(0);
      setHasMore(false);
    }
  };

  const performSearch = useCallback(
    async (pageToFetch: number) => {
      setIsLoading(true);
      if (pageToFetch === 1) {
        setError(null);
      }

      try {
        let queryParamsObj: Record<string, string> = {
          limit: String(currentLimit),
          page: String(pageToFetch),
          ...apiExtraParams,
        };

        if (searchType === "user") {
          queryParamsObj.author = searchTerm.trim();
        } else if (searchType === "tags") {
          queryParamsObj.tags = searchTerm.trim().replace(/\s+/g, ",");
        } else {
          queryParamsObj.searchTerm = searchTerm.trim();
        }

        if (
          !searchTerm.trim() &&
          (searchType === "general" ||
            searchType === "user" ||
            searchType === "tags")
        ) {
          if (pageToFetch === 1) setSearchResults([]);
          setHasMore(false);
          setIsLoading(false);
          return;
        }

        const queryParams = new URLSearchParams(queryParamsObj);
        const fullApiUrl = `${apiEndpoint}?${queryParams.toString()}`;

        const response = await fetch(fullApiUrl);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Error ${response.status}: ${
              errorData.message || response.statusText || "API request failed"
            }`
          );
        }

        const data: {
          images?: HivelensImageType[];
          currentPage?: number;
          totalPages?: number;
          // totalCount?: number; // Si también lo necesitas
        } = await response.json();

        if (data.images && Array.isArray(data.images)) {
          const formattedResults: ImageType[] = data.images.map((img) => ({
            id: img.id,
            thumbnailUrl: img.imageUrl, // Usamos imageUrl para la miniatura
            fullUrl: img.imageUrl, // Usamos imageUrl para la imagen completa
            alt: img.title || `Imagen de ${img.author || "Hivelens"}`, // Usamos el título como alt
            postUrl: img.postUrl, // Añadir postUrl
          }));
          setSearchResults((prevResults) =>
            pageToFetch === 1
              ? formattedResults
              : [...prevResults, ...formattedResults]
          );

          if (data.currentPage !== undefined && data.totalPages !== undefined) {
            setCurrentPage(data.currentPage);
            setTotalPages(data.totalPages);
            setHasMore(data.currentPage < data.totalPages);
          } else {
            // Fallback si la API no devuelve info de paginación
            setHasMore(formattedResults.length === currentLimit);
          }
        } else {
          if (pageToFetch === 1) setSearchResults([]);
          setHasMore(false);
        }
      } catch (err: any) {
        console.error("Error fetching images from Hivelens:", err);
        setError(err.message || errorText);
        if (pageToFetch === 1) setSearchResults([]);
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    },
    [
      searchTerm,
      apiEndpoint,
      errorText,
      apiExtraParams,
      searchType,
      currentLimit,
    ]
  );

  const handleInitiateSearch = (event?: FormEvent) => {
    if (event) event.preventDefault();
    setCurrentPage(1);
    setSearchResults([]);
    setHasMore(false);
    performSearch(1);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      performSearch(currentPage + 1);
    }
  };

  const handleLimitChange = (newLimitString: string) => {
    const newLimit = parseInt(newLimitString, 10);
    setCurrentLimit(newLimit);
    setCurrentPage(1); // Resetear a la página 1
    setSearchResults([]);
    setHasMore(false);
    if (searchTerm.trim()) performSearch(1); // Volver a buscar con el nuevo límite
  };

  const handleSearchTypeChange = (newSearchType: SearchType) => {
    setSearchType(newSearchType);
    setCurrentPage(1); // Resetear a la página 1
    setSearchResults([]);
    setHasMore(false);
    if (searchTerm.trim()) performSearch(1); // Volver a buscar con el nuevo tipo
  };

  const toggleImageSelection = (image: ImageType) => {
    // Recibir el objeto ImageType completo
    setSelectedImages((prevSelected) => {
      const isSelected = prevSelected.some(
        (selImg) => selImg.imageUrl === image.fullUrl
      );
      if (isSelected) {
        return prevSelected.filter(
          (selImg) => selImg.imageUrl !== image.fullUrl
        );
      } else {
        const newSelectedImage: SelectedImageData = {
          imageUrl: image.fullUrl,
          postUrl: image.postUrl,
          altText: image.alt,
        };
        if (maxSelectable === 1) {
          return [newSelectedImage];
        }
        if (maxSelectable > 0 && prevSelected.length >= maxSelectable) {
          return prevSelected; // No permitir más si se alcanza el límite
        }
        return [...prevSelected, newSelectedImage];
      }
    });
  };

  const handleInsert = () => {
    if (selectedImages.length > 0) {
      onInsertImages(selectedImages); // Pasar el array de objetos seleccionados
      setSelectedImages([]); // Resetear selectedImages
      if (mode === "modal") {
        handleModalOpenChange(false);
      }
    }
  };

  const getPlaceholderText = () => {
    if (searchType === "user") return "Buscar por nombre de usuario...";
    if (searchType === "tags") return "Buscar por tags (ej: tag1 tag2)...";
    return placeholderText; // Placeholder general
  };

  const renderContent = () => (
    <div className="space-y-4 p-1">
      <form onSubmit={handleInitiateSearch} className="space-y-2">
        <div className="flex gap-2 items-center">
          <Select
            value={searchType}
            onValueChange={handleSearchTypeChange}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[130px] sm:w-[150px]">
              <SelectValue placeholder="Tipo de búsqueda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="user">Usuario</SelectItem>
              <SelectItem value="tags">Tags</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={getPlaceholderText()}
            className="flex-grow"
            disabled={isLoading}
          />
          <Select
            value={String(currentLimit)}
            onValueChange={handleLimitChange}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[90px] sm:w-[100px]">
              <SelectValue placeholder="Limit" />
            </SelectTrigger>
            <SelectContent>
              {[20, 50, 100].map((limitVal) => (
                <SelectItem key={limitVal} value={String(limitVal)}>
                  {limitVal}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            disabled={isLoading || !searchTerm.trim()}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            {searchButtonText}
          </Button>
        </div>
      </form>

      {isLoading && (
        <div className="flex items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {loadingText}
        </div>
      )}
      {error && (
        <p className="text-destructive text-sm flex items-center">
          <XCircle className="mr-2 h-4 w-4" /> {error}
        </p>
      )}

      {!isLoading &&
        !error &&
        searchResults.length === 0 &&
        searchTerm.trim() && (
          <p className="text-muted-foreground text-sm">{noResultsText}</p>
        )}

      {searchResults.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto p-1">
          {searchResults.map((image) => (
            <div
              key={image.id}
              className={`relative border-2 rounded-md overflow-hidden cursor-pointer
                ${
                  selectedImages.some(
                    (selImg) => selImg.imageUrl === image.fullUrl
                  ) // Comprobar por imageUrl
                    ? "border-primary ring-2 ring-primary"
                    : "border-transparent hover:border-muted-foreground/50"
                }`}
              onClick={() => toggleImageSelection(image)} // Pasar el objeto imagen completo
              title={image.alt} // Mostrar el alt text (título de la imagen) en el hover
            >
              <NextImage
                src={image.thumbnailUrl}
                alt={image.alt || `Imagen ${image.id}`}
                width={150} // Proporciona un ancho base para la miniatura
                height={150} // Proporciona una altura base para la miniatura
                className="w-full h-32 object-cover" // Tailwind para controlar el tamaño visual y object-fit
                // loading="lazy" // Next/Image maneja esto automáticamente
              />
              {selectedImages.some(
                (selImg) => selImg.imageUrl === image.fullUrl
              ) && (
                <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {hasMore && !isLoading && searchResults.length > 0 && (
        <div className="mt-4 flex justify-center">
          <Button
            onClick={handleLoadMore}
            variant="outline"
            disabled={isLoading}
          >
            Cargar más resultados{" "}
            {/* Considerar internacionalizar este texto */}
          </Button>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="flex justify-end gap-2 mt-4">
          {mode === "modal" && (
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
          )}
          <Button
            onClick={handleInsert}
            disabled={selectedImages.length === 0 || isLoading} // Usar selectedImages.length
          >
            <ImagePlus className="mr-2 h-4 w-4" />
            {insertButtonText} ({selectedImages.length}){" "}
            {/* Usar selectedImages.length */}
          </Button>
        </div>
      )}
    </div>
  );

  if (mode === "modal") {
    return (
      <Dialog open={currentModalOpen} onOpenChange={handleModalOpenChange}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px]">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          {renderContent()}
        </DialogContent>
      </Dialog>
    );
  }

  return renderContent();
}
