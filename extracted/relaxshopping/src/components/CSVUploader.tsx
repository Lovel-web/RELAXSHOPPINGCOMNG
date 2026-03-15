import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CSVProduct {
  name: string;
  description: string;
  price: number;
  unit: string;
  stock: number;
  imageBase64: string;
}

interface CSVUploaderProps {
  onProductsUploaded: (products: CSVProduct[]) => void;
}

export function CSVUploader({ onProductsUploaded }: CSVUploaderProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const parseCSV = (text: string): CSVProduct[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['name', 'description', 'price', 'unit', 'stock', 'imagebase64'];
    
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    const products: CSVProduct[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) continue;

      const product: any = {};
      headers.forEach((header, index) => {
        product[header] = values[index];
      });

      products.push({
        name: product.name,
        description: product.description || '',
        price: parseFloat(product.price),
        unit: product.unit,
        stock: parseInt(product.stock),
        imageBase64: product.imagebase64 || '',
      });
    }

    return products;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload a CSV file',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const text = await file.text();
      const products = parseCSV(text);
      
      if (products.length === 0) {
        throw new Error('No valid products found in CSV');
      }

      onProductsUploaded(products);
      toast({
        title: 'Success',
        description: `Parsed ${products.length} products from CSV`,
      });
    } catch (error: any) {
      toast({
        title: 'CSV Parse Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <Card className="border-secondary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-secondary" />
          Bulk Upload via CSV
        </CardTitle>
        <CardDescription>
          Upload multiple products at once using a CSV file
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            CSV must have columns: <strong>name, description, price, unit, stock, imageBase64</strong>
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-2">
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={uploading}
            className="cursor-pointer"
          />
          <Button 
            disabled={uploading}
            variant="outline"
            className="w-full"
            onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? 'Processing...' : 'Choose CSV File'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
