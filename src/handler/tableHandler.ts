interface TableHandler {
  process(record: any): Promise<void>;
}
