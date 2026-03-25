import fs from 'fs';
import path from 'path';
import { Mapping } from '../types';

const mappingPath = path.join(__dirname, '../../mapping.json');
const mappingData = fs.readFileSync(mappingPath, 'utf-8');
export const mapping: Mapping = JSON.parse(mappingData);