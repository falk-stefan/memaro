import { Get, Path, Queries, Route } from '@tsoa/runtime';
import { ReadInstructionsQuery } from '../dto/instruction.dto.js';
import { InstructionService } from '../service/instruction.service.js';

@Route('/v1/instructions')
export class InstructionController {
  @Get()
  public async readInstructions(@Queries() query: ReadInstructionsQuery) {
    return InstructionService.readInstructions(query);
  }

  @Get('{docId}')
  public async getInstruction(@Path() docId: number) {
    return InstructionService.getInstruction({ docId });
  }
}
